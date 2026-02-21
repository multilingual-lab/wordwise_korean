# Development Notes

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn
- Chrome or Edge browser

### Setup

```bash
pnpm install   # ~1-2 minutes
pnpm dev       # builds, opens Chrome, loads extension, watches for changes
```

### Test the Extension

**On a real Korean website**
- https://ko.wikipedia.org/wiki/한국어
- https://news.naver.com
- https://twitter.com (search for 한국어)

### Configure Settings

1. Click the extension icon (puzzle piece) in the browser toolbar
2. Popup controls:
   - **Toggle** – enable / disable
   - **Level** – TOPIK I (1,578 words), TOPIK Ⅱ (4,486 words), or All (6,064 words)
   - **Language** – English, 中文 (Simplified Chinese), or 日本語 (Japanese)
   - **Font size** – 80%–150% slider
   - **Highlight** – show background highlight under annotated words
3. Changes apply immediately

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

The content script uses a **two-phase initialization** to avoid loading vocabulary on non-Korean pages.

```
Page Load
    ↓
── Phase 1: Korean presence check (cheap) ────────────────────
KOREAN_RE.test(document.body.innerText)?
    │ Yes                               │ No
    ↓                                   ↓
initializeFull()          sentinel MutationObserver
    ↑                      (watches addedNodes + characterData)
    │                      Korean text appears?
    └──────────────────────────────────┘
── Phase 2: Full init (runs only once, only on Korean pages) ─
    ↓
Load User Config (chrome.storage)
    ↓
Load Vocabulary (filter by level)
    ↓
Create Annotator Instance
    ↓
Process DOM (find Korean text nodes)
    ↓
Replace with <ruby> tags
    ↓
Start DOMObserver (watch for new content)
    ↓
Listen for config changes
```

**Why two phases?** Korean text appears on `.kr` domains but also on Reddit, Wikipedia, Twitter, etc. URL patterns can't gate the cost. The sentinel observer watches only `addedNodes` and `characterData` mutations rather than rescanning `document.body.innerText` on every mutation, so Phase 1 stays near-zero cost on non-Korean pages.

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

### Potential Bottlenecks
- Large pages with lots of Korean text
- Sites with heavy DOM manipulation
- Deep nesting levels

### Solutions
- Process nodes in batches
- Increase debounce delay if needed
- Add option to disable on specific sites

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

```typescript
{
  "wordwise_config": {
    enabled: boolean,
    level: 1 | 2 | 3,
    targetLanguage: "en" | "zh" | "ja",
    showHighlight: boolean
  },
  "wordwise_stats": { // Future feature
    wordsLearned: number,
    pagesVisited: number,
    lastUpdated: timestamp
  }
}
```

## Vocabulary Data Schema

```typescript
interface VocabEntry {
  word: string;              // Korean word (dictionary form)
  level: 1 | 2;             // TOPIK level (1=I, 2=II) — must be integer
  pos: string;              // Part of speech: "noun", "verb", "adjective", etc.
  translations: {
    en: string;              // English
    zh: string;              // Simplified Chinese
    ja: string;              // Japanese
  };
}
```

**Current Stats (v0.1.3):**
- Total: **6,064 words** — TOPIK I: 1,578 · TOPIK II: 4,486
- Grammar particles excluded: 20 common particles (은/는/이/가/을/를/의/도/와/과/etc.)
- All three languages fully translated (EN / 中文 / 日本語)
- English translations: parentheticals stripped, tilde meta-descriptions removed, near-synonyms deduplicated, verbose `to/being/to be` prefixes removed
- `pos` field populated on all entries — required for POS-aware verb/noun disambiguation

**File Size:** ~1.5 MB (uncompressed JSON), ~1 MB after Vite bundling into content script

## CSS Tips

### Ruby Tag Gotchas
- Must use `ruby-position: over` (not `above`)
- Line height needs extra space (2.0+)
- `display: inline-ruby` prevents layout breaks

### Browser Differences
- Chrome/Edge: Fully supports ruby
- Firefox: Mostly supports, minor rendering differences
- Safari: Good support

## Automated Tests

The project uses **Vitest** for unit testing. Run with:

```bash
pnpm test          # Run all tests once
pnpm test:watch    # Watch mode during development
```

### Test Files

| File | Coverage |
|------|----------|
| `src/tests/vocab-translations.test.ts` | Data integrity, polysemous word protection, verbose prefix removal, concise translation selection, new TOPIK II word coverage |
| `src/tests/stem-matching.test.ts` | `extractStems()` output, past/present/connector conjugation resolution, `couldBeConjugationOf()`, known limitations |

**Current results: 109/109 tests passing**

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

## Future Enhancements

### Short Term
- [ ] Add ㅐ/ㅓ-contraction patterns (`가서→가다`, `와서→오다`)
- [ ] Improve Chinese/Japanese translations (use batch-translate.js)
- [ ] Add statistics tracking
- [ ] Performance monitoring dashboard

### Medium Term (Month 2)
- [ ] User custom vocabulary
- [ ] Import/export vocab lists
- [ ] Pronunciation audio
- [ ] Dark mode styling

### Long Term (Month 3+)
- [ ] Dictionary API integration
- [ ] Spaced repetition system
- [ ] Learning progress tracking
- [ ] Cloud sync
- [ ] Mobile support

## Recent Bug Fixes & Improvements

### v0.1.2 - POS-aware stem lookup + translation cleanup (2026-02-20)
**Added**: POS-aware `extractStemsForLookup()` with `verbOnly` flags; `VERB_ONLY_ENDINGS`, `AMBIGUOUS_ENDINGS`, `HA_IRREGULAR_ENDINGS`
**Added**: Two-pass annotator lookup (Pass 1: POS-enforced, Pass 2: pos-absent relaxation)
**Added**: Translation display cleanup — parenthetical stripping, tilde meta-description removal, 38-cluster synonym dedup
**Fixed**: Noun/verb collisions: `살`/`살다`, `배우`/`배우다`, `서`/`서다`, `해요`/`하다`
**Fixed**: Digit-compound annotation (1심, 2층 etc.) with digit guard
**Fixed**: Level-switch crash: `oldConfig ?? DEFAULT_CONFIG`
**Added**: Merged extended TOPIK II word list → 6,064 total words
**Fixed**: 277 duplicate entries, 260 verbose prefixes, 1,283 translation conflicts
**Added**: Vitest test suite — 78 → 109 tests

### v0.1.1 - Font size control (2026-02-16)
See CHANGELOG.md for full details.

### v2.2.5 - Grammar Particle Filtering (legacy)
**Fixed**: Common particles (은/는/이/가/을/를) were being annotated as vocabulary words
**Solution**: Added `COMMON_PARTICLES` Set to filter out 20 common functional words

### v2.2.4 - Level Switching Bug
**Fixed**: Changing vocabulary level in popup didn't reload vocabulary
**Solution**: Changed comparison from `config.level` to `oldConfig.level` (captured before async update)

### v2.2.3 - Enhanced Logging
**Added**: Detailed console logging showing:
- Old level → New level when changed
- Vocabulary words loaded count
- Annotations added/cleared count

## Common Issues & Solutions

### Issue: Extension not loading
**Check**: 
- WXT dev server running?
- Extension enabled in chrome://extensions?
- Any console errors?

### Issue: No annotations
**Check**:
- Extension enabled in popup?
- Page has Korean text?
- Vocabulary level includes words?
- Check processed nodes count
- Check console for "Loaded X vocabulary words" message

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
- After any change to `topik-vocab.json`, always run `pnpm update-counts` to keep the landing page in sync.

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

## Quick Reference

### Important Files
- `content.ts` - Main logic
- `annotator.ts` - Core engine
- `vocabulary-loader.ts` - Vocab management
- `topik-vocab.json` - Data source

### Key Constants
- `SKIP_TAGS` - Elements to ignore
- `ANNOTATION_CLASS` - Ruby tag class
- `DEBOUNCE_MS` - Observer delay (500ms)

### Useful Commands
```bash
pnpm dev           # Development with hot reload
pnpm build         # Production build
pnpm compile       # Type check only
pnpm test          # Run automated test suite (109 tests)
pnpm test:watch    # Tests in watch mode
pnpm zip           # Create distributable ZIP
```
