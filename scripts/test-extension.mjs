import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import puppeteer from 'puppeteer';

const extensionPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.output', 'chrome-mv3');
const executablePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find(path => existsSync(path));
const server = createServer((request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  const content = request.url === '/dynamic.html' ? '<p>Waiting for chat messages</p>' : '<p id="sample">학교</p>';
  const frames = request.url === '/fixture.html'
    ? `<iframe id="same" src="/frame.html"></iframe><iframe id="cross" src="http://localhost:${server.address().port}/frame.html"></iframe>`
    : '';
  response.end(`<!doctype html><html><head><title>WordWise extension test</title></head><body>${content}${frames}</body></html>`);
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    pipe: true,
    enableExtensions: [extensionPath],
    ...(executablePath ? { executablePath } : {}),
  });
  const target = await browser.waitForTarget(target =>
    target.type() === 'service_worker' && target.url().endsWith('/background.js'),
  );
  const worker = await target.worker();
  assert(worker, 'Extension background worker must start');
  const manifest = await worker.evaluate(() => chrome.runtime.getManifest());
  if (!manifest.content_scripts?.length) {
    const deadline = Date.now() + 10_000;
    let scripts = [];
    while (Date.now() < deadline) {
      scripts = await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts());
      if (scripts.length) break;
      await delay(100);
    }
    assert.equal(scripts.length, 1, 'Development build must register its content script');
    assert.equal(scripts[0].allFrames, true, 'Development registration must include frames');
  } else {
    assert.equal(manifest.content_scripts.length, 1);
    assert.equal(manifest.content_scripts[0].all_frames, true);
  }

  let config = {
    enabled: true, siteMode: 'all', allowedDomains: [], level: 1,
    targetLanguage: 'en', showHighlight: true, fontSize: 100,
  };
  const save = async patch => {
    config = { ...config, ...patch };
    await worker.evaluate(config => chrome.storage.sync.set({ wordwise_config: config }), config);
  };
  await save({});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && message.text().includes('WordWise Korean')) errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/fixture.html`);
  const same = await (await page.$('#same')).contentFrame();
  const cross = await (await page.$('#cross')).contentFrame();
  assert(same && cross, 'Both article frames must load');
  const translated = frame => frame.waitForFunction(() =>
    document.querySelector('#sample ruby.word-wise-korean rt')?.textContent === 'school',
  );
  const cleared = frame => frame.waitForFunction(() =>
    document.querySelectorAll('ruby.word-wise-korean').length === 0 &&
    document.querySelector('#sample')?.textContent === '학교' &&
    !document.getElementById('wordwise-korean-styles'),
  );

  await Promise.all([translated(page), translated(same), translated(cross)]);
  await save({ siteMode: 'allowlist', allowedDomains: [] });
  await Promise.all([cleared(page), cleared(same), cleared(cross)]);
  await page.evaluate(() => {
    const message = document.createElement('p');
    message.id = 'later';
    message.textContent = '학생';
    document.body.appendChild(message);
  });
  await delay(700);
  assert.equal(await page.$eval('#later', element => element.textContent), '학생');
  assert.equal(await page.$$eval('ruby.word-wise-korean', nodes => nodes.length), 0);

  await save({ allowedDomains: ['localhost'] });
  await Promise.all([cleared(page), cleared(same), translated(cross)]);
  await save({ allowedDomains: ['127.0.0.1'] });
  await Promise.all([translated(page), translated(same), cleared(cross)]);
  await page.waitForFunction(() => document.querySelector('#later rt')?.textContent === 'student');
  await save({ enabled: false });
  await Promise.all([cleared(page), cleared(same), cleared(cross)]);
  await save({ targetLanguage: 'ja', fontSize: 130 });
  await save({ enabled: true });
  await page.waitForFunction(() => document.querySelector('#sample rt')?.textContent === '学校');
  await save({ targetLanguage: 'en', siteMode: 'all', allowedDomains: [] });
  await Promise.all([translated(page), translated(same), translated(cross)]);

  const dynamic = await browser.newPage();
  await dynamic.goto(`http://127.0.0.1:${server.address().port}/dynamic.html`);
  assert.equal(await dynamic.$('#wordwise-korean-styles'), null);
  await dynamic.evaluate(() => {
    const message = document.createElement('p');
    message.id = 'sample';
    message.textContent = '학교';
    document.body.appendChild(message);
  });
  await translated(dynamic);
  for (const enabled of [false, true, false]) await save({ enabled });
  await delay(700);
  await Promise.all([cleared(page), cleared(same), cleared(cross), cleared(dynamic)]);
  assert.deepEqual(errors, []);
  console.log('Real extension browser checks passed: annotations, live cleanup, domain gating, independent frames, settings while paused, and later chat text.');
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
