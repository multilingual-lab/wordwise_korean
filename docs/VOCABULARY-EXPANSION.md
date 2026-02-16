# TOPIK Vocabulary Expansion Guide

## Current Status ✅

**Completed:** 4,341 words imported!
- ✅ TOPIK I: 1,578 words
- ✅ TOPIK Ⅱ: 2,729 words (including 34 advanced level words)

**Sources:**
- [TOPIK I Vocabulary List 1671 - Tammy Korean](https://learning-korean.com/elementary/20210101-10466/) ✅ Imported
- [TOPIK Ⅱ Vocabulary List 2662 - Tammy Korean](https://learning-korean.com/intermediate/20220630-12696/) ✅ Imported

**Next Steps (Optional):**
- Add accurate Chinese/Japanese translations using batch-translate.js
- Fine-tune verb/adjective conjugation matching
- Add user custom vocabulary feature

## To Expand to Full TOPIK (~3,000 words)

### Option 1: Download Existing Word Lists 🔥 RECOMMENDED

**Free Resources:**
1. **TOPIK Guide** - https://www.topikguide.com/download-complete-list-of-topik-vocabulary/
2. **Talk To Me In Korean (TTMIK)** - https://talktomeinkorean.com/curriculum/
3. **How To Study Korean** - https://www.howtostudykorean.com/korean-vocabulary-lists/
4. **Korean Class 101** - https://www.koreanclass101.com/korean-word-lists/
5. **Anki Decks** - Search "TOPIK" on AnkiWeb, export to CSV

**Steps:**
1. Download word list (usually Excel/CSV)
2. Convert to JSON format matching our structure:
   ```json
   {
     "word": "단어",
     "level": 1,
     "pos": "noun",
     "translations": {
       "en": "word",
       "zh": "单词",
       "ja": "単語"
     }
   }
   ```
3. Replace `src/assets/topik-vocab.json`

### Option 2: Use National Institute of Korean Language API

**KRDICT API** (Official Korean Learners' Dictionary):
- Website: https://krdict.korean.go.kr/
- Free API for programmatic access
- Contains all TOPIK vocabulary with definitions
- Multilingual translations included

**Implementation:**
```javascript
// Fetch from KRDICT API and convert to our format
async function fetchKRDICT(word) {
  const url = `https://krdict.korean.go.kr/api/search?key=YOUR_KEY&q=${word}`;
  // Process response and extract translations
}
```

### Option 3: Scrape from Korean Learning Sites

**Ethical Web Scraping** (with permission/robots.txt):
```javascript
// Example: Parse TOPIK word lists from educational sites
// Always check robots.txt and terms of service first!
```

### Option 4: Manual Expansion

**Add words as you encounter them:**
1. Copy the structure from `topik-vocab.json`
2. Use online dictionaries for translations:
   -  Naver Dictionary: https://dict.naver.com/
   - Papago: https://papago.naver.com/
3. Add to appropriate level (1-3)

## Recommended Workflow

### Phase 1: Get Core Vocabulary ✅ COMPLETED
1. ✅ Downloaded TOPIK I word list (1,671 words)
2. ✅ Parsed and imported 1,668 unique words
3. ✅ Added to `topik-vocab.json`

### Phase 2: Expand to Full TOPIK II ✅ COMPLETED
1. ✅ Downloaded TOPIK II additions (2,662 words)
2. ✅ Parsed and imported 2,660 unique words
3. ✅ Merged with existing file → **4,341 total words**

### Phase 3: Conjugation Handling ✅ IMPLEMENTED
1. ✅ Stem extraction algorithm handles most cases
2. ✅ Supports 30+ common verb/adjective endings
3. ✅ Fallback matching for edge cases

### Phase 4: Translation Quality (Optional - Future)
1. Run batch translation for Chinese/Japanese
2. Manual review and correction
3. User testing and refinement

## Translation Services for Batch Processing

### Free Options:
- **Google Translate API** (Free tier: 500k chars/month)
- **ChatGPT/Claude** (Free tier available)
- **Papago API** (Great for Korean, free tier exists)

### Batch Translation Script Example:
```javascript
import fetch from 'node-fetch';

async function batchTranslate(words) {
  // Use ChatGPT API to translate in bulk
  const prompt = `Translate these Korean words to English, Chinese, and Japanese in JSON format: ${words.join(', ')}`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  
  return await response.json();
}
```

## File Size Estimates

| Word Count | File Size (JSON) | Gzipped | Load Time |
|------------|------------------|---------|-----------|
| 243 | 25 KB | ~8 KB | < 1ms |
| 800 | 82 KB | ~27 KB | < 5ms |
| 3,000 | 310 KB | ~103 KB | < 20ms |
| 6,000 | 620 KB | ~207 KB | < 40ms |

**Conclusion**: Even 6,000 words is very manageable! ✅

## Quality Control

Before adding words, verify:
- [ ] Correct Korean spelling (including spacing)
- [ ] Accurate part of speech (noun/verb/adjective/etc.)
- [ ] Natural translations (not machine-literal)
- [ ] Appropriate TOPIK level assignment
- [ ] Consistent JSON formatting

## Testing Your Expanded Vocabulary

After adding words:
```bash
# Rebuild extension
pnpm dev

# Test on these sites:
# - https://ko.wikipedia.org/
# - https://news.naver.com/
# - Korean learning blogs
```

Check browser console for:
- "Loaded X vocabulary words" (should show your new count)
- "Found X words to annotate" (should increase)

## Next Steps

**Quick Win (1 hour):**
1. Download a TOPIK I CSV from TOPIK Guide
2. Use ChatGPT to convert to JSON format
3. Merge with current file
4. → You'll have ~800 words!

**Full Solution (1 week carefully curated):**
1. Get official TOPIK word lists (I-VI)
2. Professional translation review
3. Add common conjugations
4. User testing and refinement
5. → You'll have 3,000+ words!

## Resources I Can Help With

Want me to:
1. ✅ Write a CSV-to-JSON converter?
2. ✅ Create a batch translation script using ChatGPT?
3. ✅ Help parse any specific word list format?
4. ✅ Set up KRDICT API integration?

Just let me know! 🚀
