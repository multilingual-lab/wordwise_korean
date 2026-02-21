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

**Option A – Test page (recommended first time)**
1. Open `test.html` in the browser opened by WXT
2. Translations should appear above Korean words
3. Use the "Add Korean Text" button to test dynamic content

**Option B – Real Korean websites**
- https://ko.wikipedia.org/wiki/한국어
- https://news.naver.com
- https://twitter.com (search for 한국어)

### Configure Settings

1. Click the extension icon (puzzle piece) in the browser toolbar
2. Popup controls:
   - **Toggle** – enable / disable
   - **Level** – TOPIK I (~1,600 words), TOPIK Ⅱ (~2,700 words), or All (~4,300 words)
   - **Language** – English (Chinese & Japanese coming soon)
   - **Highlight** – show background highlight
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
```
Page Load
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
Start MutationObserver (watch for new content)
    ↓
Listen for config changes
```

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
<ruby class="word-wise-korean word-wise-highlight">
  <rt>translation</rt>
  한국어
</ruby>
```

CSS positions `<rt>` above base text automatically.

## Performance Considerations

### Optimization Techniques
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
  word: string;              // Korean word
  level: 1 | 2;             // TOPIK level (1=I, 2=II)
  translations: {
    en: string;
    zh: string;              // Placeholder (can use batch-translate.js)
    ja: string;              // Placeholder (can use batch-translate.js)
  };
  pos?: string;             // Part of speech (optional)
}
```

**Current Stats:**
- Grammar particles excluded: 20 common particles (은/는/이/가/을/를/의/도/와/과/etc.)
- Translations: English only (Chinese & Japanese are placeholders)
- All translations free of verbose `to /being /to be ` prefixes (stripped 2026-02-20)
- Translation display: parentheticals stripped, tilde meta-descriptions removed, near-synonyms deduplicated

**File Size:** ~1 MB (uncompressed JSON), ~630 KB after Vite bundling into content script

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
**Added**: Merged extended TOPIK II word list → 6,065 total words
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
