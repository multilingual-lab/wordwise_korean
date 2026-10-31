# Development Notes

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Test the Extension](#test-the-extension)
  - [Configure Settings](#configure-settings)
  - [Development Workflow](#development-workflow)
- [Architecture Overview](#architecture-overview)
  - [Content Script Flow](#content-script-flow)
  - [Annotation Algorithm](#annotation-algorithm)
  - [Ruby Tag Structure](#ruby-tag-structure)
- [Performance Considerations](#performance-considerations)
  - [Optimization Techniques](#optimization-techniques)
- [Edge Cases Handled](#edge-cases-handled)
- [Browser Compatibility](#browser-compatibility)
  - [Chrome/Edge (Manifest V3)](#chromeedge-manifest-v3)
  - [Firefox](#firefox)
- [Chrome Storage Schema](#chrome-storage-schema)
- [CSS Tips](#css-tips)
  - [Ruby Tag Gotchas](#ruby-tag-gotchas)
  - [Browser Differences](#browser-differences)
- [Automated Tests](#automated-tests)
  - [Test Files](#test-files)
  - [Stem-Matching Architecture (v0.1.2)](#stem-matching-architecture-v012)
  - [Digit-Compound Guard](#digit-compound-guard)
  - [Known Stem-Matching Limitations](#known-stem-matching-limitations)
- [Manual Testing Checklist](#manual-testing-checklist)
  - [Static Pages](#static-pages)
  - [Dynamic Pages](#dynamic-pages)
  - [Edge Cases](#edge-cases)
  - [Settings](#settings)
- [Common Issues & Solutions](#common-issues--solutions)
  - [Extension not loading](#issue-extension-not-loading)
  - [No annotations](#issue-no-annotations)
  - [Build errors / stale cache](#issue-build-errors--stale-cache)
  - [Port already in use](#issue-port-already-in-use-port-3000)
  - [Performance slow](#issue-performance-slow)
  - [Wrong annotations](#issue-wrong-annotations)
- [Debugging Tips](#debugging-tips)
  - [Console Logging](#console-logging)
  - [Chrome DevTools](#chrome-devtools)
  - [Performance Profiling](#performance-profiling)
- [Contracts & Dependencies](#contracts--dependencies)
  - [1. Annotation HTML contract](#1-annotation-html-contract--rubyword-wise-korean)
  - [2. Landing page vocab counts](#2-landing-page-vocab-counts--data-vocab-count-attributes)
  - [3. Demo iframe language switcher](#3-demo-iframe-language-switcher--postmessage-protocol)
  - [4. Popup word counts](#4-popup-word-counts--dynamic-derivation-from-json)
  - [5. Vocab JSON schema](#5-vocab-json-schema)
- [Automation](#automation)
- [Release Process](#release-process)
- [Quick Reference](#quick-reference)
  - [Project Structure](#project-structure)
  - [Important Files](#important-files)
  - [Important Files](#important-files)
  - [Key Constants](#key-constants)
  - [Useful Commands](#useful-commands)

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn
- Chrome or Edge browser

### Setup

```bash
pnpm install   # ~1-2 minutes
pnpm dev       # builds, opens Chrome on Naver Blog, loads extension, watches for changes
```

### Test the Extension

**On a real Korean website**
- https://ko.wikipedia.org/wiki/한국어
- https://news.naver.com
- https://twitter.com (search for 한국어)

### Configure Settings

1. Click the extension icon (puzzle piece) in the browser toolbar
2. Popup controls:
   - **Header** – global enable/disable toggle, homepage link, and current-site status
   - **Learning tab** – TOPIK I, TOPIK II, or All; English, 中文 (Simplified Chinese), or 日本語 (Japanese)
   - **Websites tab** – all websites or only listed domains; current-site shortcut and domain/HTTP(S) URL entry
   - **Appearance tab** – 80%–150% translation size and word highlighting
3. Changes apply immediately

Domains include subdomains, but embedded frames must match independently. An empty allowlist enables no websites. Tab navigation supports Left/Right, Home, and End; switching tabs preserves unsaved domain input.

### Development Workflow

All TypeScript files live in `src/`. WXT auto-reloads the extension on save.

Key files to edit:

| File | Purpose |
|------|---------|
| `src/entrypoints/content.ts` | Main annotation logic |
| `src/utils/annotator.ts` | Core matching engine |
| `src/utils/korean-stem.ts` | Conjugation handling |
| `src/entrypoints/popup/App.vue` | Popup UI |
| `src/assets/topik-vocab.json` | TOPIK vocabulary database |

See [scripts/README.md](scripts/README.md) for tools to parse PDFs, convert CSVs, and batch-translate. Source vocab files are in `data/`.

---

## Architecture Overview

### Content Script Flow

The content script checks **website eligibility before Korean presence**. Each frame uses its own HTTP(S) hostname.

```
Page Load
    ↓
Register storage listener, then load and validate settings
    ↓
Global toggle on + supported scheme + allowed hostname?
    │ No                                │ Yes
    ↓                                   ↓
Idle: settings listener only     Korean presence check
                                        │ No
                                        ↓
                               sentinel MutationObserver
                               (addedNodes + characterData)
                                        │ Korean appears
                                        ↓
                               Load vocabulary for latest settings
                                        ↓
                               Create annotator and styles
                                        ↓
                               Process DOM and start DOMObserver

Settings changed
    ↓
Re-evaluate eligibility; stop observers and clear annotations
when disabled; otherwise update styles or rebuild as needed
```

**Why both checks?** Domain controls avoid all text scanning and DOM observation on unlisted pages. Allowed pages still wait for Korean text before constructing the vocabulary map and annotator. Storage changes are handled even on idle pages, without refreshing. Startup ignores an initial storage snapshot if a newer settings event arrives during the read; updates have no delayed restart callbacks.

### Annotation Algorithm

1. **Text Collection**: TreeWalker finds all text nodes
2. **Korean Detection**: Regex `/[가-힣]/` checks for Korean
3. **Word Matching**: 
   - Sort vocabulary by word length (longest first)
   - Find all matches in text
   - Track positions to avoid overlaps
4. **Replacement**: Build HTML with ruby tags
5. **DOM Update**: Replace text node with annotated span

### Ruby Tag Structure

```html
<ruby class="word-wise-korean">한국어<rt>Korean language</rt></ruby>
<!-- with highlight enabled: -->
<ruby class="word-wise-korean word-wise-highlight">한국어<rt>Korean language</rt></ruby>
```

The Korean base text comes **first**, the `<rt>` annotation comes **after** it inside the ruby element. CSS positions `<rt>` above the base text automatically via `ruby-position: over`.

## Performance Considerations

### Optimization Techniques
- ✅ **Two-phase init**: vocabulary (~1.5 MB uncompressed) is never loaded on non-Korean pages
- ✅ **WeakSet** for processed nodes (prevents re-processing)
- ✅ **Debouncing** (500ms) for dynamic content
- ✅ **Skip tags** (script, style, svg, etc.)
- ✅ **Sorted matching** (longest words first)
- ✅ **Position tracking** (avoid overlap calculation)
- ✅ **Domain gating**: unlisted pages keep only a storage listener, without scanning text or observing the DOM
- ✅ **`all_frames`**: one WXT entrypoint registers top-level and iframe scripts; each frame checks its own hostname, and frames without a body bail out

## Edge Cases Handled

1. **Overlapping Words**: "한국어" vs "한국"
   - Solution: Sort by length, track matched positions

2. **Repeated Words**: "친구 친구 친구"
   - Solution: Find all occurrences in text

3. **Mixed Content**: "I am a 학생"
   - Solution: Only annotate Korean matches

4. **No Spaces**: "친구학교도서관"
   - Solution: Regex finds all occurrences

5. **Dynamic Content**: Infinite scroll, SPAs
   - Solution: MutationObserver with debounce

6. **Already Processed**: Avoid re-annotation
   - Solution: WeakSet tracking

7. **`contenteditable` editors (Notion, Google Docs, etc.)**: Rich-text editors own their DOM and actively revert external mutations. When the extension annotates text inside such an editor, the editor restores the node using `textContent` — which includes the `<rt>` translation text — causing the translation to leak into the plain text. The annotator then re-annotates the corrupted text, creating an infinite loop that appends the translation string on every cycle.
   - Solution: `isContentEditable` guard in `processNode()` — both ELEMENT_NODE (skip + don't recurse) and TEXT_NODE (skip if parent is contenteditable)

8. **Pages that load content inside iframes**: Some sites (blog platforms, news readers) render their main article content inside a same-origin `<iframe>` while the outer shell has little or no Korean text. Without `all_frames: true` in the manifest, the content script only runs in the top frame and never sees the article text.
   - Solution: `all_frames: true` in `wxt.config.ts` content_scripts entry; `document.body` null-guard at the top of `main()` to bail out of blank/hidden frames instantly

## Browser Compatibility

### Chrome/Edge (Manifest V3)
- ✅ Full support
- ✅ chrome.storage.sync
- ✅ Content scripts
- ✅ Popup

### Firefox
- ✅ Compatible with WXT build
- ⚠️ Requires browser.* API instead of chrome.*
- Use `pnpm build:firefox`

## Chrome Storage Schema

Storage key: `wordwise_config` (via `chrome.storage.sync`). Defined in `src/types/index.ts`.

```typescript
// Key: STORAGE_KEYS.CONFIG = 'wordwise_config'
{
  enabled: boolean,           // annotation on/off
  siteMode: "all" | "allowlist",
  allowedDomains: string[],   // normalized hostnames; each includes subdomains
  level: 1 | 2 | 3,          // 1 = TOPIK I only, 2 = TOPIK II only, 3 = all levels
  targetLanguage: "en" | "zh" | "ja",
  showHighlight: boolean,     // background tint under annotated words
  fontSize: number,           // annotation font size, 80–150 (percentage)
}
```

`getUserConfig()` in `src/utils/site-policy.ts` validates saved settings and adds defaults for older installations. Missing website settings default to `siteMode: "all"` and an empty list, preserving existing behavior. Domains are normalized and deduplicated; malformed settings produce a visible popup error and pause content processing rather than silently enabling all websites.

> **Note:** `level` in `UserConfig` means *which levels to show*: `3` = show all. This is different from `VocabEntry.level` which is always `1` or `2` (the word's TOPIK tier). Never use `3` as a vocab entry level.

## CSS Tips

### Ruby Tag Gotchas
- Must use `ruby-position: over` (not `above`)
- Line height needs extra space (2.0+)
- `display: inline-ruby` prevents layout breaks

### Browser Differences
- Chrome/Edge: Fully supports ruby
- Firefox: Mostly supports, minor rendering differences
- Safari: Not a tested target

## Automated Tests

The project uses **Vitest** for unit testing. Run with:

```bash
pnpm test          # Run all tests once
pnpm test:watch    # Watch mode during development
pnpm test:sites    # Production build, popup browser checks, real-extension browser checks
pnpm test:extension # Real-extension checks against the current Chrome build
```

### Test Files

| File | Coverage |
|------|----------|
| `src/tests/vocab-translations.test.ts` | Data integrity, polysemous word protection, verbose prefix removal, concise translation selection, new TOPIK II word coverage |
| `src/tests/stem-matching.test.ts` | `extractStems()` output, past/present/connector conjugation resolution, `couldBeConjugationOf()`, known limitations |
| `src/tests/site-policy.test.ts` | Domain normalization, URL validation, hostname boundaries, configuration migration, global toggle precedence |
| `src/tests/content-site-policy.test.ts` | Idle-page gating, live activation/removal, later Korean text, rapid changes, initialization races |
| `scripts/test-site-controls.mjs` | Popup tabs, keyboard navigation, header layout, scrollbar checks, domain editing, ordered saves, errors and retry |
| `scripts/test-extension.mjs` | Actual unpacked Chrome extension injection, literal translations, independent frames, dynamic chat messages, live cleanup |

Browser checks use Puppeteer with installed Chrome/Edge on Windows, or `CHROME_PATH` pointing to a compatible browser executable. Run `pnpm test:extension` in a second terminal while `pnpm dev` runs to verify development registration. Stop the dev server before `pnpm test:sites` or packaging: they replace the Chrome output with a production build.

### Stem-Matching Architecture (v0.1.2)

The annotator uses a **POS-aware two-pass lookup**:

1. **`extractStemsForLookup(word)`** returns `StemCandidate[]` each with a `verbOnly` flag
   - `verbOnly=true` when the suffix is grammatically impossible after a noun (`고`, `니까`, `었어요`, etc.)
   - `는`/`은` are treated as ambiguous: single-char stem → `verbOnly=true`, longer stem → `verbOnly=false`
   - `HA_IRREGULAR_ENDINGS` maps `해요/했어요` → `하` base

2. **Pass 1** (POS-enforced): accept candidate only if `!verbOnly || VERB_POS.has(candidate.pos)`

3. **Pass 2** (graceful fallback): same but allows entries with `pos == undefined` — still blocks known nouns when `verbOnly=true`

### Digit-Compound Guard

In `findReplacements()`, a Korean token is skipped if the preceding character is a digit:
```typescript
if (index > 0 && /[0-9]/.test(text[index - 1])) continue;
```
Prevents `1심`, `2층`, `3복`, etc. from being annotated.

### Known Stem-Matching Limitations

| Input | Expected | Status |
|-------|----------|--------|
| `가서` | `가다` (go) | ❌ unhandled — Unicode ㅐ-contraction |

All other previously-known collisions (살/살다, 배우/배우다, 서/서다, 해요/하다) are **resolved** in v0.1.2.

## Manual Testing Checklist

### Static Pages
- [ ] Wikipedia
- [ ] News sites
- [ ] Blogs

### Dynamic Pages
- [ ] Twitter/X
- [ ] Reddit
- [ ] Modern SPAs

### Edge Cases
- [ ] Very long pages (>10000 characters)
- [ ] Pages with no Korean text
- [ ] Mixed scripts (Korean + Chinese)
- [ ] Special characters

### Settings
- [ ] Enable/disable toggle
- [ ] Level switching (1, 2, 3)
- [ ] Language switching (en, zh, ja)
- [ ] Highlight toggle
- [ ] Font size changes without re-annotation
- [ ] All websites / only listed websites and an empty list
- [ ] Add/remove the current domain without refreshing
- [ ] Domain/subdomain matching and independently gated embedded frames
- [ ] Keyboard tab navigation; no scrollbars in Appearance
- [ ] Load/save errors remain visible and the header toggle stays disabled if settings fail to load

## Common Issues & Solutions

### Issue: Extension not loading
**Check**: 
- WXT dev server running?
- Extension enabled in chrome://extensions?
- Any console errors?

### Issue: No annotations
**Check**:
- Extension enabled in popup?
- Current site allowed by website mode?
- Page has Korean text?
- Vocabulary level includes words?
- Check processed nodes count
- Check console for errors or the annotation-count message

WXT 0.19.29 includes compatibility handling for Vite's development WebSocket connection; older WXT releases can show a working popup without registering content scripts. Restore dependencies from the lockfile. In noninteractive environments, set `CI=true` before starting the dev server so Vite does not exit when stdin closes.

### Issue: Build errors / stale cache
**Solution**: Clear caches and rebuild:
```bash
rm -rf .wxt .output node_modules
pnpm install
pnpm dev
```

### Issue: Port already in use (port 3000)
**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Issue: Performance slow
**Solutions**:
- Increase debounce delay (500ms → 1000ms)
- Reduce vocabulary size
- Add site exclusion list

### Issue: Wrong annotations
**Check**:
- Word order (longest first?)
- Position tracking working?
- Translation language correct?

## Debugging Tips

### Console Logging
```typescript
console.log('Processed nodes:', processedCount);
console.log('Matched words:', replacements.length);
console.log('Current config:', config);
```

### Chrome DevTools
1. **Content Script**: Page console (F12)
2. **Popup**: Right-click popup → Inspect
3. **Background**: Extensions page → Inspect views

### Performance Profiling
```typescript
console.time('processNode');
annotator.processNode(document.body);
console.timeEnd('processNode');
```

---

## Contracts & Dependencies

These are the **cross-file coupling points** where a rename or restructure in one place will silently break something else. Always update *all* sides of a contract together.

---

### 1. Annotation HTML contract — `ruby.word-wise-korean`

**Produced by:** `src/utils/annotator.ts` (`ANNOTATION_CLASS = 'word-wise-korean'`)

**Consumed by:**

| Consumer | What it uses |
|----------|--------------|
| `src/entrypoints/content.ts` | CSS rules `ruby.word-wise-korean` and `ruby.word-wise-korean rt` |
| `docs/demo-x.html` | CSS rules `ruby.word-wise-korean` and `ruby.word-wise-korean rt`; `setLang()` uses `document.querySelectorAll('ruby.word-wise-korean rt')` |

**Rules:**
- The class name `word-wise-korean` must match across all three files.
- The `<rt>` element is the **first child** of `<ruby>` and holds the translation text.
- `setLang()` in `demo-x.html` caches the original English text in `rt.dataset.en` on first run. If the HTML in `demo-x.html` changes to a different structure (e.g. `rt` after the Korean text), the language switcher will break.

**HTML shape:**
```html
<ruby class="word-wise-korean">한국어<rt>Korean language</rt></ruby>
```

---

### 2. Landing page vocab counts — `data-vocab-count` attributes

**Written by:** `scripts/update-vocab-counts.mjs` (run via `pnpm update-counts`)

**Read from / patched in:** `docs/index.html`

The script targets these exact elements (matched by regex):

```html
<div class="level-count" data-vocab-count="1">1,578</div>
<div class="level-count" data-vocab-count="2">4,486</div>
<div class="level-count" data-vocab-count="all">6,064</div>
```

It also patches this sentence pattern:

```html
All 6,064 translations are bundled locally
```

**Rules:**
- Do **not** remove `data-vocab-count` attributes or rename the values `"1"` / `"2"` / `"all"`.
- Do **not** change the `class="level-count"` on those elements (the regex anchors on the full opening tag).
- Do **not** change the wording `"translations are bundled locally"` — the script uses that as an anchor.
- See [Automation](#automation) for when to re-run these scripts.

---

### 3. Demo iframe language switcher — postMessage protocol

**Sender:** `docs/index.html` (tab click handler at bottom of file)

**Receiver:** `docs/demo-x.html` (`window.addEventListener('message', ...)`)

**Message shape:**
```js
{ type: 'setLang', lang: 'en' | 'zh' | 'ja' }
```

**Coupling points in `index.html`:**

| Element | Attribute | Value |
|---------|-----------|-------|
| `<button class="demo-lang-tab">` | `data-lang` | `"en"` \| `"zh"` \| `"ja"` |
| `<iframe>` inside `.demo-wrap` | (selector) | must match `document.querySelector('.demo-wrap iframe')` |

**Rules:**
- Renaming `.demo-lang-tab` or `.demo-wrap` breaks the JS tab handler.
- The `lang` values in `data-lang` must match the keys in the `TRANS` lookup object in `demo-x.html` (`'zh'` and `'ja'`; `'en'` is the fallback).
- Adding a new language requires: a new `<button data-lang="...">` in `index.html`, and a corresponding key added to every entry in the `TRANS` object in `demo-x.html`.
- The `setLang()` function stores the original EN text in `rt.dataset.en` on first call. New `<rt>` elements added to the demo HTML must contain **English** text initially.

---

### 4. Popup word counts — dynamic derivation from JSON

**Source:** `src/assets/topik-vocab.json` (each entry has a `level` field: `1` or `2`)

**Consumed by:** `src/entrypoints/popup/App.vue`

```ts
const vocabCounts = {
  1: _vocab.filter(e => e.level === 1).length,
  2: _vocab.filter(e => e.level === 2).length,
  all: _vocab.length,
};
```

**Rules:**
- The `level` field in JSON entries must be the integer `1` or `2` (not a string).
- There are no hardcoded counts in the popup — counts are always derived at build time.
- No action needed when vocab changes; counts update automatically on the next `pnpm build` / `pnpm dev`.

---

### 5. Vocab JSON schema

**File:** `src/assets/topik-vocab.json`

Every entry must conform to:

```ts
{
  word: string,        // Korean dictionary form
  level: 1 | 2,       // TOPIK level (integer)
  pos: string,        // part-of-speech tag (e.g. "noun", "verb", "adjective")
  translations: {
    en: string,        // English translation (short, no parentheticals)
    zh: string,        // Simplified Chinese
    ja: string,        // Japanese
  }
}
```

**Rules:**
- `level` must be integer `1` or `2`; the popup filter and `update-vocab-counts.mjs` both rely on this.
- After editing vocab, run `pnpm update-counts` (landing page) and `pnpm test` (data integrity).

---

## Automation

Certain source files have downstream artifacts that must be kept in sync manually. Run the corresponding command whenever a trigger changes.

| Trigger | Command | What it does |
|---|---|---|
| `src/assets/topik-vocab.json` changes | `pnpm update-counts` | Patches word counts in `docs/index.html` |
| `docs/index.html` changes visually | `pnpm screenshot` | Regenerates `.github/images/` PNGs for README + Chrome Web Store |
| `src/public/icon/icon.svg` changes | `pnpm generate-icons` | Rebuilds `16.png`, `48.png`, `128.png` in `src/public/icon/` |
| New vocab words need translating | `node scripts/batch-translate.js` | Calls Azure OpenAI, outputs `topik-vocab-translated.json` |

### Batch translation workflow

Requires `AZURE_OPENAI_KEY` env var. Safe workflow to avoid overwriting good data:

```powershell
$env:AZURE_OPENAI_KEY="<your-key>"
node scripts/batch-translate.js
# Review src/assets/topik-vocab-translated.json
Move-Item src/assets/topik-vocab-translated.json src/assets/topik-vocab.json -Force
pnpm test   # verify data integrity
```

### Screenshots

Both images are captured from `docs/index.html` via headless Chrome (Puppeteer). No server needed — the script opens the local HTML file directly.

| File | Dimensions | Used for |
|---|---|---|
| `.github/images/landingpage.png` | 1280×700, nav hidden | README hero image |
| `.github/images/landingpage-1280x800.png` | 1280×800, full page | Chrome Web Store marquee tile |

---

## Release Process

Step-by-step checklist for cutting a new release.

> ⚠️ Version must be bumped in **two places** — they are independent and both affect outputs.

**1. Bump version**

Just say *"bump to vX.Y.Z"* — Copilot will edit both files. Or do it manually:

```
package.json          → "version": "x.y.z"
wxt.config.ts         → version: 'x.y.z'   ← controls the ZIP filename
```

**2. Update docs + assets (if changed)**
```bash
pnpm update-counts    # if topik-vocab.json changed
pnpm screenshot       # if docs/index.html changed visually
```

**3. Update CHANGELOG.md** — dated user-facing entries (Added / Improved / Fixed), plus any permission or privacy changes. Update the landing page, README, and privacy policy when behavior changes.

**4. Run tests**
```bash
pnpm test
pnpm compile
pnpm validate-docs
pnpm test:sites
```

Stop `pnpm dev` before production browser checks or packaging. A development popup alone is not sufficient validation: the browser checks must load the actual extension and find rendered translations.

**5. Build and verify ZIPs before committing**
```bash
pnpm zip:all
# Outputs:
#   .output/wordwise-korean-X.Y.Z-chromium.zip  ← Chrome, Edge, Brave, Opera, Vivaldi
#   .output/wordwise-korean-X.Y.Z-firefox.zip   ← Firefox (MV2)
#   .output/wordwise-korean-X.Y.Z-sources.zip   ← Firefox AMO reviewer requirement

# Or build individually:
pnpm zip          # Chromium only
pnpm zip:firefox  # Firefox + sources
```

> **Note:** `sources.zip` is only for Mozilla reviewers — upload it as "source code" during
> AMO submission. Firefox users install `firefox.zip` directly; do not attach `sources.zip`
> to the GitHub release.

The source archive includes the regression tests via `zip.includeSources`, overriding WXT's default test-file exclusion. Verify that it contains the dependency lockfile, new helpers, and test scripts as well as the extension source.

Inspect each packaged `manifest.json`: the version must match the release, there must be exactly one all-frame content script, and production packages must not contain development-only `tabs`/`scripting` permissions, localhost host entries, or a development content security policy. The Chrome package must retain `storage`, `activeTab`, and `<all_urls>` host access. Smoke-test the unpacked production build before uploading.

**6. Review, commit, tag, push**

Review the staged changes and add only the files intended for this release. Do not commit `.output/`, `node_modules/`, or temporary browser profiles. Rebuild from the committed tree if changes are made after packaging.

```bash
git diff --check
git diff --stat
git add <reviewed-release-files>
git diff --cached
git commit -m "feat: vX.Y.Z website controls and tabbed settings" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

**7. Create GitHub Release**
- Go to `https://github.com/multilingual-lab/wordwise_korean/releases/new?tag=vX.Y.Z`
- Paste CHANGELOG entries as release notes
- Attach `.output/wordwise-korean-X.Y.Z-chromium.zip` and `.output/wordwise-korean-X.Y.Z-firefox.zip`
- _(Do **not** attach `sources.zip` — that goes to AMO, not GitHub)_

There is no tag-triggered GitHub release or Chrome Web Store publishing workflow in this repository. The existing GitHub Pages workflow deploys `docs/` changes pushed to `main`; wait for it to finish so the updated privacy policy is live before store submission.

**8. Submit Chrome Web Store update**

- Open the existing WordWise Korean item in the Chrome Web Store Developer Dashboard. Upload the **production Chromium ZIP**, not the Firefox ZIP or development output.
- Update the description and screenshots to show website controls and the new settings tabs. Use real extension screenshots; `pnpm screenshot` captures the landing page, not the settings popup.
- Review Privacy practices and permission justifications against the actual packaged manifest. Explain `storage` (preferences and browser-managed sync), `activeTab` (current-site status and explicit add/remove shortcut on popup opening), and `<all_urls>` (the optional all-websites mode).
- Keep the single purpose: local inline Korean vocabulary annotations for learning. Website controls do not reduce host permissions.
- Use the live privacy policy: `https://multilingual-lab.github.io/wordwise_korean/privacy.html`.
- Save the submission draft, review all fields, then submit for review. Uploading a package is not the same as publishing it.

### v0.1.5 submission notes

**GitHub release title:** `v0.1.5 - Website controls and tabbed settings`

Use the v0.1.5 section of [CHANGELOG.md](CHANGELOG.md) as the GitHub release body. Attach:
- `.output/wordwise-korean-0.1.5-chromium.zip`
- `.output/wordwise-korean-0.1.5-firefox.zip`

**Chrome listing description addition:**

> Choose where you learn: enable inline translations on all websites, or only domains you list. Add the current website with one click. Domains include subdomains, and changes apply immediately without refreshing. Adjust vocabulary and language in Learning, manage domains in Websites, and customize size/highlighting in Appearance. All translations run locally; your preferences and manually added domains may sync through your browser.

**What's new / update summary:**

> New website controls let you limit annotations to X.com, chat sites, or any domains you choose. The redesigned popup separates Learning, Websites, and Appearance settings, with an always-visible enable toggle and current-site status. Improved live settings updates and iframe handling. Existing users keep all-websites behavior until they choose a domain list.

**Permission rationale for the new `activeTab` permission:**

> When the user opens the popup, WordWise Korean reads the active tab's hostname to show whether annotations are enabled and offer an explicit Add/Remove this website action. The URL is not logged; only the hostname is saved if the user chooses to add it.

**Store screenshot checklist:**
- Show annotations on a Korean page with the Learning tab and header toggle visible.
- Show Websites with Only listed websites selected and a sample domain list.
- Show Appearance with translation size and highlighting, without scrollbars.
- Capture screenshots in a Chrome Web Store-supported size (1280x800 or 640x400) and avoid displaying private chats, account details, or browsing history.

---

## Quick Reference

### Project Structure

```
wordwise_korean/
├── src/
│   ├── entrypoints/
│   │   ├── content.ts           # Two-phase init, styles, config listener
│   │   ├── background.ts        # Background script
│   │   └── popup/               # Settings UI (Vue 3)
│   ├── utils/
│   │   ├── annotator.ts         # Core annotation engine (POS-aware stem lookup)
│   │   ├── vocabulary-loader.ts # Load + filter vocab by level
│   │   ├── korean-stem.ts       # Conjugation stripping, extractStemsForLookup()
│   │   └── dom-observer.ts      # MutationObserver for dynamic content
│   ├── assets/
│   │   └── topik-vocab.json     # Bundled vocabulary database (see data/README.md)
│   ├── tests/
│   │   ├── vocab-translations.test.ts
│   │   └── stem-matching.test.ts
│   └── types/
│       └── index.ts             # UserConfig, VocabEntry, STORAGE_KEYS, DEFAULT_CONFIG
├── scripts/
│   ├── batch-translate.js       # AI translation tool (Azure OpenAI)
│   ├── update-vocab-counts.mjs  # Sync word counts in docs/index.html
│   ├── screenshot.mjs           # Capture landing page screenshots
│   ├── generate-icons.mjs       # Rebuild extension icon PNGs from icon.svg
│   ├── validate-docs.mjs        # Pre-commit doc fact checker
│   └── README.md
├── git-hooks/
│   └── pre-commit               # Runs validate-docs.mjs on every commit
├── data/
│   └── README.md                # Vocabulary sources & customization guide
├── docs/                        # GitHub Pages landing page
├── .github/images/              # README + store screenshots
├── vitest.config.ts
├── wxt.config.ts                # Version must match package.json
└── package.json
```

### Important Files
- `src/entrypoints/content.ts` — two-phase init, styles, config change listener
- `src/utils/annotator.ts` — core matching engine (POS-aware stem lookup)
- `src/utils/korean-stem.ts` — conjugation stripping, `extractStemsForLookup()`
- `src/utils/vocabulary-loader.ts` — load + filter vocab by level
- `src/utils/dom-observer.ts` — MutationObserver for dynamic content
- `src/entrypoints/popup/App.vue` — popup UI
- `src/assets/topik-vocab.json` — bundled vocabulary database
- `src/types/index.ts` — `UserConfig`, `VocabEntry`, `STORAGE_KEYS`, `DEFAULT_CONFIG`

### Key Constants
- `SKIP_TAGS` - Element tag names to ignore
- `isContentEditable` guard - Skips annotation inside rich-text editors (Notion, Google Docs, etc.)
- `ANNOTATION_CLASS` - Ruby tag class
- `DEBOUNCE_MS` - Observer delay (500ms)

### Useful Commands
```bash
pnpm dev           # Development with hot reload
pnpm build         # Production build
pnpm compile       # Type check only
pnpm test          # Run automated test suite
pnpm test:watch    # Tests in watch mode
pnpm zip           # Build Chromium ZIP (.output/...-chromium.zip)
pnpm zip:firefox   # Build Firefox ZIP + sources.zip (required by Firefox AMO)
pnpm zip:all       # Build both Chromium and Firefox ZIPs
pnpm update-counts # Sync vocab counts in docs/index.html from JSON
pnpm screenshot    # Regenerate store + README screenshots
pnpm generate-icons # Rebuild icon PNGs from icon.svg
```
