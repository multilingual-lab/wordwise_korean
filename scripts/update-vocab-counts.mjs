/**
 * update-vocab-counts.mjs
 *
 * Reads src/assets/topik-vocab.json — the single source of truth — and patches
 * the landing page (docs/index.html) with live counts. Run after any vocab change:
 *
 *   pnpm update-counts
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Count ───────────────────────────────────────────────────────────────────
const vocab = JSON.parse(readFileSync(join(root, 'src/assets/topik-vocab.json'), 'utf-8'));
const l1    = vocab.filter(e => e.level === 1).length;
const l2    = vocab.filter(e => e.level === 2).length;
const total = vocab.length;

const fmt = n => n.toLocaleString('en-US');
console.log(`Counts → TOPIK I: ${fmt(l1)}  TOPIK II: ${fmt(l2)}  Total: ${fmt(total)}`);

// ── Patch docs/index.html only ──────────────────────────────────────────────
const htmlPath = join(root, 'docs/index.html');
let html = readFileSync(htmlPath, 'utf-8');

html = html.replace(
  /(<div class="level-count" data-vocab-count="1">)[\s\S]*?(<\/div>)/,
  `$1${fmt(l1)}$2`
);
html = html.replace(
  /(<div class="level-count" data-vocab-count="2">)[\s\S]*?(<\/div>)/,
  `$1${fmt(l2)}$2`
);
html = html.replace(
  /(<div class="level-count" data-vocab-count="all">)[\s\S]*?(<\/div>)/,
  `$1${fmt(total)}$2`
);
html = html.replace(
  /(All )\d[\d,]+( translations are bundled locally)/,
  `$1${fmt(total)}$2`
);

writeFileSync(htmlPath, html, 'utf-8');
console.log('✓ docs/index.html updated.');
console.log('\nDone! Re-run whenever topik-vocab.json changes.');
