import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.output', 'chrome-mv3');
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.content_scripts.length, 1, 'Register the content script only once');
assert.equal(manifest.content_scripts[0].all_frames, true, 'Keep iframe annotation support');
assert(manifest.permissions.includes('activeTab'), 'Allow reading the website when opening the popup');
const executablePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find(path => existsSync(path));
const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
const server = createServer(async (request, response) => {
  const path = resolve(root, `.${new URL(request.url, 'http://localhost').pathname}`);
  if (!path.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(path);
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(path)] || 'application/octet-stream' });
    response.end(body);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(error);
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await puppeteer.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const address = server.address();
  assert(address && typeof address !== 'string');
  const popupUrl = `http://127.0.0.1:${address.port}/popup.html`;
  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 600 });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.evaluateOnNewDocument(() => {
    window.testState = {
      saved: { enabled: true, level: 2, targetLanguage: 'en', showHighlight: true, fontSize: 100 },
      url: 'https://x.com/home',
      failSave: false,
      failLoad: false,
      writes: [],
    };
    window.chrome = {
      storage: {
        sync: {
          async get() {
            if (window.testState.failLoad) throw new Error('Simulated read failure');
            return { wordwise_config: structuredClone(window.testState.saved) };
          },
          async set(values) {
            await new Promise(resolve => setTimeout(resolve, 10));
            if (window.testState.failSave) throw new Error('Simulated write failure');
            window.testState.saved = structuredClone(values.wordwise_config);
            window.testState.writes.push(structuredClone(values.wordwise_config));
          },
        },
      },
      tabs: { async query() { return [{ url: window.testState.url }]; } },
    };
  });

  const waitSaved = () => page.waitForFunction(() =>
    document.querySelector('.save-status')?.textContent.includes('Saved'),
  );
  const button = async label => {
    const buttons = await page.$$('button');
    for (const candidate of buttons) {
      if (await candidate.evaluate((element, label) => element.textContent.trim() === label, label)) {
        await candidate.click();
        return;
      }
    }
    throw new Error(`Button not found: ${label}`);
  };
  const fillDomain = async value => {
    await page.$eval('#new-domain', (input, value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    await button('Add');
  };

  await page.goto(popupUrl);
  await page.waitForFunction(() => !document.querySelector('fieldset').disabled);
  assert.equal(await page.$$eval('.landing-link', links => links.length), 1);
  assert.equal(await page.$eval('.header .landing-link', link => link.textContent.trim()), 'Visit homepage ↗');
  assert.equal(await page.$eval('.header .landing-link', link => link.target), '_blank');
  assert.equal(await page.$('.subtitle'), null);
  assert.equal(await page.$('.info-section'), null);
  assert.equal(await page.$eval('.header [aria-label="Enable annotations"]', input => input.disabled), false);
  const headerLayout = await page.$eval('.header-inner', header => {
    const bounds = header.getBoundingClientRect();
    const title = header.querySelector('.title').getBoundingClientRect();
    const toggle = header.querySelector('.toggle-track').getBoundingClientRect();
    return {
      titleFits: title.right <= toggle.left,
      toggleFits: toggle.right <= bounds.right && toggle.top >= bounds.top && toggle.bottom <= bounds.bottom,
    };
  });
  assert.deepEqual(headerLayout, { titleFits: true, toggleFits: true }, 'Header toggle must fit beside the title');
  assert.equal(await page.$$eval('[role="tab"]', tabs => tabs.length), 3);
  assert.equal(await page.$eval('[role="tab"][aria-selected="true"]', tab => tab.id), 'tab-learning');
  const tabStyle = await page.$eval('#tab-learning', tab => {
    const style = getComputedStyle(tab);
    return {
      background: style.backgroundColor, radius: style.borderRadius,
      underline: style.borderBottomWidth, underlineColor: style.borderBottomColor,
    };
  });
  assert.deepEqual(tabStyle, {
    background: 'rgba(0, 0, 0, 0)', radius: '0px',
    underline: '2px', underlineColor: 'rgb(139, 92, 246)',
  }, 'Selected tab should use a flat underline, not a button-shaped background');
  const assertPanel = async id => {
    assert.deepEqual(await page.$$eval('[role="tabpanel"]', panels =>
      panels.filter(panel => !panel.hidden).map(panel => panel.id),
    ), [`panel-${id}`]);
    assert.equal(await page.$eval('[role="tab"][aria-selected="true"]', tab => tab.id), `tab-${id}`);
    assert.equal(await page.$$eval('[role="tab"]', tabs => tabs.filter(tab => tab.tabIndex === 0).length), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const height = await page.$eval('.popup-container', element => element.getBoundingClientRect().height);
    assert(height <= 600, `Popup must fit within 600px; ${id} is ${height}px tall`);
    assert.equal(await page.$eval('#app', element => element.getBoundingClientRect().height), height,
      'Popup must not leave an empty minimum-height footer');
    const panelSize = await page.$eval(`#panel-${id}`, panel => ({
      width: panel.clientWidth, contentWidth: panel.scrollWidth,
      height: panel.clientHeight, contentHeight: panel.scrollHeight,
    }));
    assert(panelSize.contentWidth <= panelSize.width,
      `${id} must not scroll horizontally: ${JSON.stringify(panelSize)}`);
    if (id === 'appearance') {
      assert(panelSize.contentHeight <= panelSize.height,
        `Appearance must not scroll vertically: ${JSON.stringify(panelSize)}`);
    }
  };
  await assertPanel('learning');
  assert.equal(await page.$eval('#panel-learning', panel => getComputedStyle(panel).gap), '24px');
  assert.equal(await page.$eval('#panel-learning', panel => panel.querySelectorAll('.setting-hint').length), 1,
    'Keep vocabulary counts without repeating the selected translation language');
  await button('TOPIK I');
  await waitSaved();
  await page.select('#translation-language', 'ja');
  await waitSaved();
  assert.equal(await page.evaluate(() => window.testState.saved.level), 1);
  assert.equal(await page.evaluate(() => window.testState.saved.targetLanguage), 'ja');

  await page.focus('#tab-learning');
  await page.keyboard.press('ArrowLeft');
  await assertPanel('appearance');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-appearance');
  await page.$eval('#translation-size', input => {
    input.value = '130';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await waitSaved();
  await page.$eval('[aria-label="Highlight annotated words"]', input => input.click());
  await waitSaved();
  assert.equal(await page.evaluate(() => window.testState.saved.fontSize), 130);
  assert.equal(await page.evaluate(() => window.testState.saved.showHighlight), false);
  await page.$eval('[aria-label="Enable annotations"]', input => input.click());
  await waitSaved();
  assert.match(await page.$eval('.site-status', element => element.textContent), /Paused/);
  await page.$eval('[aria-label="Enable annotations"]', input => input.click());
  await waitSaved();
  await page.focus('#tab-appearance');
  await page.keyboard.press('Home');
  await assertPanel('learning');
  await page.keyboard.press('End');
  await assertPanel('appearance');
  await page.keyboard.press('ArrowRight');
  await assertPanel('learning');
  await page.keyboard.press('ArrowRight');
  await assertPanel('websites');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'panel-websites');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'site-mode');
  assert.deepEqual(await page.evaluate(() => ({
    level: window.testState.saved.level,
    targetLanguage: window.testState.saved.targetLanguage,
    fontSize: window.testState.saved.fontSize,
    showHighlight: window.testState.saved.showHighlight,
  })), { level: 1, targetLanguage: 'ja', fontSize: 130, showHighlight: false });
  assert.equal(await page.$eval('#site-mode', select => select.value), 'all');
  await page.select('#site-mode', 'allowlist');
  await waitSaved();
  assert.match(await page.$eval('.site-status', element => element.textContent), /not listed/);
  await button('Add this website');
  await waitSaved();
  assert.deepEqual(await page.evaluate(() => window.testState.saved.allowedDomains), ['x.com']);
  assert.match(await page.$eval('.site-status', element => element.textContent), /Enabled on x.com/);

  await page.click('.domain-manager summary');
  await fillDomain('*.example.com');
  await page.waitForSelector('#domain-error');
  assert.match(await page.$eval('#domain-error', element => element.textContent), /wildcards/);
  await fillDomain('https://CHAT.example.com:443/room?test=1');
  await waitSaved();
  assert.deepEqual(await page.evaluate(() => window.testState.saved.allowedDomains), ['x.com', 'chat.example.com']);
  await fillDomain('X.COM');
  await page.waitForSelector('#domain-error');
  assert.match(await page.$eval('#domain-error', element => element.textContent), /already listed/);
  await assertPanel('websites');
  await page.$eval('#new-domain', input => {
    input.value = 'draft.example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.click('#tab-learning');
  await assertPanel('learning');
  await page.click('#tab-websites');
  assert.equal(await page.$eval('#new-domain', input => input.value), 'draft.example.com');
  assert.equal(await page.$eval('.domain-manager', details => details.open), true);

  await page.evaluate(() => { window.testState.failSave = true; });
  await button('Remove this website');
  await page.waitForFunction(() => document.querySelector('.save-status')?.textContent.includes('Save failed'));
  assert.equal(await page.$eval('.save-status', status => status.classList.contains('save-status-error')), true);
  await assertPanel('websites');
  assert.match(await page.$eval('.site-status', element => element.textContent), /Enabled on x.com/);
  assert.deepEqual(await page.evaluate(() => window.testState.saved.allowedDomains), ['x.com', 'chat.example.com']);
  await page.evaluate(() => { window.testState.failSave = false; });
  await button('Remove this website');
  await waitSaved();
  assert.match(await page.$eval('.site-status', element => element.textContent), /not listed/);

  await page.select('#site-mode', 'all');
  await waitSaved();
  await page.select('#site-mode', 'allowlist');
  await waitSaved();
  assert.deepEqual(await page.evaluate(() => window.testState.saved.allowedDomains), ['chat.example.com']);
  await page.evaluate(() => {
    const mode = document.querySelector('#site-mode');
    for (const value of ['all', 'allowlist', 'all']) {
      mode.value = value;
      mode.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await waitSaved();
  assert.equal(await page.evaluate(() => window.testState.saved.siteMode), 'all');
  assert.equal(await page.evaluate(() => window.testState.writes.at(-1).siteMode), 'all');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  await page.evaluate(() => {
    window.testState.saved.siteMode = 'allowlist';
    window.testState.saved.allowedDomains = ['x.com'];
    window.testState.url = 'https://mobile.x.com/home';
  });
  const savedState = await page.evaluate(() => structuredClone(window.testState));
  const inherited = await browser.newPage();
  await inherited.evaluateOnNewDocument(state => {
    window.chrome = {
      storage: { sync: { async get() { return { wordwise_config: state.saved }; } } },
      tabs: { async query() { return [{ url: state.url }]; } },
    };
  }, savedState);
  await inherited.goto(popupUrl);
  await inherited.waitForFunction(() => !document.querySelector('fieldset').disabled);
  await inherited.click('#tab-websites');
  assert.match(await inherited.$eval('.site-status', element => element.textContent), /Enabled on mobile.x.com/);
  assert.match(await inherited.$eval('main', element => element.textContent), /Included by x.com/);
  await inherited.close();

  const unavailable = await browser.newPage();
  await unavailable.evaluateOnNewDocument(() => {
    window.chrome = {
      storage: { sync: { async get() { throw new Error('Simulated read failure'); } } },
      tabs: { async query() { return [{ url: 'chrome://settings/' }]; } },
    };
  });
  await unavailable.goto(popupUrl);
  await unavailable.waitForSelector('.error-message');
  assert.equal(await unavailable.$eval('fieldset', element => element.disabled), true);
  assert.equal(await unavailable.$eval('.header [aria-label="Enable annotations"]', input => input.disabled), true);
  assert.match(await unavailable.$eval('main', element => element.textContent), /Could not load settings/);
  assert.match(await unavailable.$eval('.site-status', element => element.textContent), /Unavailable on this browser page/);
  await unavailable.evaluate(() => {
    window.chrome.storage.sync.get = async () => ({});
    document.querySelector('.error-message button').click();
  });
  await unavailable.waitForFunction(() => !document.querySelector('fieldset').disabled);
  assert.equal(await unavailable.$eval('.header [aria-label="Enable annotations"]', input => input.disabled), false);
  await unavailable.click('#tab-websites');
  assert.equal(await unavailable.$eval('#site-mode', select => select.value), 'all');
  await unavailable.close();

  assert.deepEqual(pageErrors, []);
  console.log('Tabbed popup browser checks passed: keyboard navigation, compact layout, learning/appearance saves, domain controls, drafts, rollback, queued saves, and load retry.');
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
