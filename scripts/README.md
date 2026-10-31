# Scripts

Tools for managing, expanding, and maintaining the TOPIK vocabulary and project assets.

## Quick Reference

| Script | Command | Purpose |
|---|---|---|
| `batch-translate.js` | `node scripts/batch-translate.js` | Translate all missing zh/ja via Azure OpenAI |
| `update-vocab-counts.mjs` | `pnpm update-counts` | Patch word counts in `docs/index.html` |
| `screenshot.mjs` | `pnpm screenshot` | Capture landing page PNGs for README + store |
| `generate-icons.mjs` | `pnpm generate-icons` | Rebuild extension icon PNGs from `icon.svg` |
| `validate-docs.mjs` | `pnpm validate-docs` | Check docs match reality (version, scripts, word count) |
| `test-site-controls.mjs` | `pnpm test:sites` | Build production Chrome and check popup tabs, settings, validation, and layout |
| `test-extension.mjs` | `pnpm test:extension` | Check actual Chrome extension injection, translations, domain gating, and frames |
| `improve-translations.py` | `python scripts/improve-translations.py` | Clean up verbose/noisy translations |
| `merge-topik2-vocab.py` | `python scripts/merge-topik2-vocab.py` | Merge scraped TOPIK II words into main vocab |
| `scrape-topik2-3900.py` | `python scripts/scrape-topik2-3900.py` | Scrape TOPIK II 3,900-word list from web |

---

## Script Details

### `batch-translate.js` — Batch translate via Azure OpenAI

Translates all entries in `topik-vocab.json` that have missing or placeholder `zh`/`ja` fields. Outputs to a separate file so you can review before overwriting.

**Requires:** `AZURE_OPENAI_KEY` environment variable (Azure OpenAI, not standard OpenAI).  
The endpoint is hardcoded to the lab Azure deployment (`lab-oai-ext-je.openai.azure.com`, gpt-4o-mini).

```powershell
# Windows
$env:AZURE_OPENAI_KEY="<your-key>"
node scripts/batch-translate.js
```

**Input:** `src/assets/topik-vocab.json`  
**Output:** `src/assets/topik-vocab-translated.json` (never overwrites the original directly)

Review the output, then replace:
```powershell
Move-Item src/assets/topik-vocab-translated.json src/assets/topik-vocab.json -Force
```

---

### `update-vocab-counts.mjs` — Sync word counts in landing page

Reads `src/assets/topik-vocab.json` and patches the word-count numbers displayed in `docs/index.html`.

```bash
pnpm update-counts
```

Run this after any change to `topik-vocab.json` that adds or removes entries.

---

### `screenshot.mjs` — Capture landing page screenshots

Uses headless Puppeteer to capture two PNG screenshots of `docs/index.html`:

| Output | Size | Use |
|---|---|---|
| `.github/images/landingpage-1280x800.png` | 1280×800 | Chrome Web Store marquee image |
| `.github/images/landingpage.png` | 1280×700 | README hero image (nav hidden) |

```bash
pnpm screenshot
```

Run this after any visual change to `docs/index.html`.

---

### `generate-icons.mjs` — Rebuild extension icon PNGs

Generates the required chrome extension icon sizes (16, 32, 48, 96, 128 px) from `src/public/icon/icon.svg`.

```bash
pnpm generate-icons
```

Run this after editing `icon.svg`.

---

### Browser regression checks

`pnpm test:sites` builds the production Chrome extension, runs `test-site-controls.mjs`, then runs `test-extension.mjs`. Stop `pnpm dev` first because this replaces the Chrome build output.

`test-site-controls.mjs` loads the built popup with controlled browser API fixtures to check keyboard navigation, header layout, domain editing, load/save failures, and absence of Appearance scrollbars.

`test-extension.mjs` loads the actual unpacked extension through Chrome and verifies known literal translations in top-level pages and same-origin/cross-origin frames, live domain restrictions, pause/reactivation, and Korean text arriving later. `pnpm test:extension` runs it against the current output, so it can also check a development build while `pnpm dev` is running in another terminal.

Both scripts use Puppeteer and detect installed Chrome/Edge on Windows. Set `CHROME_PATH` if needed. For the landing-page screenshot script, Puppeteer's `PUPPETEER_EXECUTABLE_PATH` environment variable selects an installed browser when no bundled browser is available.

---

### `validate-docs.mjs` — Check docs match reality

Runs on every `git commit` automatically (via `git-hooks/pre-commit`). Also runnable manually.

```bash
pnpm validate-docs
```

**Checks:**
1. `package.json` version matches `wxt.config.ts` version
2. Every script listed in `scripts/README.md` Quick Reference exists on disk
3. The word count in `data/README.md` matches the actual length of `topik-vocab.json`

Exits with code 1 on any failure, blocking the commit.

---

### `improve-translations.py` — Clean up translation quality

Runs two cleanup passes on every entry in `topik-vocab.json`:

1. **Simplify** — keeps only the first/clearest term from comma-separated lists.  
   e.g. `"simple, easy"` → `"simple"`
2. **Shorten** — replaces lengthy descriptive strings with concise equivalents.  
   e.g. `"baked bread with red beans inside (street food)"` → `"fish-shaped pastry"`

Already applied to the current `topik-vocab.json`. Re-run after adding or merging new vocabulary.

```bash
python scripts/improve-translations.py
```

---

### `merge-topik2-vocab.py` — Merge scraped TOPIK II words

Merges `src/assets/topik2-3900-vocab.json` (scraped TOPIK II words) into `src/assets/topik-vocab.json`, deduplicating by Korean word.

```bash
python scripts/merge-topik2-vocab.py
```

Already applied — current `topik-vocab.json` is the merged and quality-audited result (~6,064 words).

---

### `scrape-topik2-3900.py` — Scrape extended TOPIK II list

Fetches the TOPIK II 3,900-word vocabulary from koreantopik.com.

```bash
python scripts/scrape-topik2-3900.py
```

**Output:** `src/assets/topik2-3900-vocab.json`

Already run — output is integrated into `topik-vocab.json`. Re-run only to refresh source data.

---

## Adding New Vocabulary — Full Workflow

```powershell
# 1. Translate missing zh/ja
$env:AZURE_OPENAI_KEY="<your-key>"
node scripts/batch-translate.js

# 2. Review topik-vocab-translated.json, then replace
Move-Item src/assets/topik-vocab-translated.json src/assets/topik-vocab.json -Force

# 3. Clean up translations (optional)
python scripts/improve-translations.py

# 4. Sync landing page counts
pnpm update-counts

# 5. Verify
pnpm test
```

---

## Troubleshooting

### Verify vocab integrity
```bash
node -e "const v=JSON.parse(require('fs').readFileSync('src/assets/topik-vocab.json')); const u=new Set(v.map(w=>w.word)); console.log('Total:', v.length, 'Unique:', u.size)"
```

See [data/README.md](../data/README.md) for vocabulary data sources.

---

## Need Help?

See [data/README.md](../data/README.md) for vocabulary data sources and the complete regeneration workflow.
