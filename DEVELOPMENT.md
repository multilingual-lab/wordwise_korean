# Development Notes

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
- Total: 4,341 words
- TOPIK I (Level 1): 1,578 words
- TOPIK Ⅱ (Level 2): 2,729 words
- Grammar particles excluded: 20 common particles (은/는/이/가/을/를/의/도/와/과/etc.)

**File Size:** ~180 KB (uncompressed), ~1 MB after bundling with content script

## CSS Tips

### Ruby Tag Gotchas
- Must use `ruby-position: over` (not `above`)
- Line height needs extra space (2.0+)
- `display: inline-ruby` prevents layout breaks

### Browser Differences
- Chrome/Edge: Fully supports ruby
- Firefox: Mostly supports, minor rendering differences
- Safari: Good support

## Testing Checklist

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
- [ ] Improve Chinese/Japanese translations (use batch-translate.js)
- [ ] Add statistics tracking
- [ ] Performance monitoring dashboard
- [ ] User testing and feedback

### Medium Term (Month 2)
- [ ] User custom vocabulary
- [ ] Import/export vocab lists
- [ ] Pronunciation audio
- [ ] Dark mode styling
- [ ] Better conjugation matching (improve stem extraction)

### Long Term (Month 3+)
- [ ] Dictionary API integration
- [ ] Spaced repetition system
- [ ] Learning progress tracking
- [ ] Cloud sync
- [ ] Mobile support

## Recent Bug Fixes & Improvements

### v2.2.5 - Grammar Particle Filtering
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
pnpm dev           # Development
pnpm build         # Production build
pnpm compile       # Type check only
pnpm zip           # Create distributable
```
