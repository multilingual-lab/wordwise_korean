#!/usr/bin/env node
/**
 * Captures landing-page screenshots for Chrome Web Store submission.
 *
 * Outputs (in .github/images/):
 *   landingpage-1280x800.png  – full page at true 1280×800 px
 *   landingpage.png           – same viewport with the nav bar hidden (hero fills the frame)
 *
 * Usage: pnpm screenshot
 */

import puppeteer from 'puppeteer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pageUrl = `file:///${join(root, 'docs', 'index.html').replace(/\\/g, '/')}`;
const outDir = join(root, '.github', 'images');
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await page.goto(pageUrl, { waitUntil: 'networkidle0' });
// Allow CSS transitions to settle
await new Promise(r => setTimeout(r, 600));

// 1. Full page with nav bar — true 1280×800
const file1 = join(outDir, 'landingpage-1280x800.png');
await page.screenshot({ path: file1, clip: { x: 0, y: 0, width: 1280, height: 800 } });
console.log(`Saved → ${file1}`);

// 2. Nav hidden — hero fills a 1280×600 frame
await page.evaluate(() => { document.querySelector('nav').style.display = 'none'; });
const file2 = join(outDir, 'landingpage.png');
await page.screenshot({ path: file2, clip: { x: 0, y: 0, width: 1280, height: 700 } });
console.log(`Saved → ${file2}`);

await browser.close();
