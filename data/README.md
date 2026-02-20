# Vocabulary Data & Customization Guide

This directory contains the raw source text files for TOPIK vocabulary and instructions for extending the vocabulary database.

---

## 📁 Source Files

### `topik-1671-words.txt`
- **Source**: [TOPIK I Vocabulary List (Tammy Korean)](https://learning-korean.com/elementary/20210101-10466/)
- **Content**: 1,671 TOPIK I vocabulary words
- **Format**: PDF text extract with "No. 한글 English" columnar format
- **Used by**: `scripts/pdf-to-vocab.js --level 1`
- **Result**: 1,668 unique words imported (99.8% success rate)

### `topik-2662-words.txt`
- **Source**: [TOPIK Ⅱ Vocabulary List (Tammy Korean)](https://learning-korean.com/intermediate/20220630-12696/)
- **Content**: 2,662 TOPIK II vocabulary words (Intermediate/Advanced)
- **Format**: PDF text extract with "No. 한글 English" columnar format
- **Used by**: `scripts/pdf-to-vocab.js --level 2 --merge`
- **Result**: 2,660 unique words imported, merged to 4,341 total words

---

## 📊 Current Status

**✅ Completed: 6,065 words (after deduplication and quality pass)**
- TOPIK I (Level 1): 1,578 words
- TOPIK Ⅱ (Level 2): 4,487 words

| Level | Words | Verbs/Adj (ending in 다) | Expressions |
|-------|-------|------------------------|-------------|
| TOPIK I | 1,578 | ~400 | ~50 |
| TOPIK Ⅱ | 4,487 | ~1,350 | ~190 |
| **Total** | **6,065** | **~1,750** | **~240** |

**Next Steps (Optional):**
- Add accurate Chinese/Japanese translations using `batch-translate.js`
- Fine-tune verb/adjective conjugation matching
- Add user custom vocabulary feature
- Expand further using KRDICT API or additional word lists

---

## 🎨 Customizing Vocabulary

### Method 1: Add/Edit Words Manually

Edit `src/assets/topik-vocab.json` directly:

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

### Method 2: Import from CSV

```bash
# Convert CSV to JSON
node scripts/csv-to-vocab.js mywords.csv --merge

# CSV format: word,level,en,zh,ja
# Example:
# 친구,1,friend,朋友,友達
# 학교,1,school,学校,学校
```

### Method 3: Parse PDF Text

```bash
# Extract text from PDF and parse
node scripts/pdf-to-vocab.js extracted-text.txt --level 1 --merge
```

### Method 4: Batch Translate

```bash
# Auto-translate missing languages using AI
node scripts/batch-translate.js src/assets/topik-vocab.json
```

See [scripts/README.md](../scripts/README.md) for detailed documentation on all scripts.

---

## 🔧 How to Extract Text from PDF

1. **Download PDF** from the source links above
2. **Open in browser** or PDF reader
3. **Select all text**: Ctrl+A (Windows) or Cmd+A (Mac)
4. **Copy**: Ctrl+C or Cmd+C
5. **Paste into text file**: Save as UTF-8 encoding
6. **Run parser**:
   ```bash
   # For TOPIK I
   node scripts/pdf-to-vocab.js data/topik-1671-words.txt --level 1
   
   # For TOPIK II (merge with TOPIK I)
   node scripts/pdf-to-vocab.js data/topik-2662-words.txt --level 2 --merge
   ```

### Text Format Example

```
TOPIKⅠVocabulary（Beginner)
No. 한글 English No. 한글 English
1 가게 store, shop 41 감사하다 thank, appreciate
2 가격 price 42 감사합니다 thank you
3 가깝다 to be close 43 같다 to be the same
...
```

The parser handles:
- Two-column format (left and right columns)
- Number prefixes (1, 2, 3...)
- Korean words (한글)
- English translations
- Section headers (automatically skipped)

---

## 🚀 Expanding to Full TOPIK Vocabulary

### Option 1: Download Existing Word Lists 🔥 RECOMMENDED

**Free Resources:**
1. **TOPIK Guide** - https://www.topikguide.com/download-complete-list-of-topik-vocabulary/
2. **Talk To Me In Korean (TTMIK)** - https://talktomeinkorean.com/curriculum/
3. **How To Study Korean** - https://www.howtostudykorean.com/korean-vocabulary-lists/
4. **Korean Class 101** - https://www.koreanclass101.com/korean-word-lists/
5. **Anki Decks** - Search "TOPIK" on AnkiWeb, export to CSV

**Steps:**
1. Download word list (usually Excel/CSV)
2. Convert to JSON format using `csv-to-vocab.js`
3. Merge with existing vocabulary

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

### Option 3: Manual Expansion

**Add words as you encounter them:**
1. Copy the structure from `topik-vocab.json`
2. Use online dictionaries for translations:
   - Naver Dictionary: https://dict.naver.com/
   - Papago: https://papago.naver.com/
3. Add to appropriate level (1-3)

---

## 🔄 Regenerating Vocabulary

To rebuild the vocabulary from scratch:

```bash
# Step 1: Parse TOPIK I (1,578 words)
node scripts/pdf-to-vocab.js data/topik-1671-words.txt --level 1

# Step 2: Merge TOPIK II PDF vocabulary
node scripts/pdf-to-vocab.js data/topik-2662-words.txt --level 2 --merge

# Apply the PDF-based vocabulary (4,341 words)
Move-Item src/assets/topik-vocab-from-pdf.json src/assets/topik-vocab.json -Force

# Step 3: Scrape and merge TOPIK II extended list from koreantopik.com (~2,000 more words)
python scripts/scrape-topik2-3900.py          # generates src/assets/topik2-3900-vocab.json
python scripts/merge-topik2-vocab.py          # merges into topik-vocab.json → 6,349 words

# Rebuild extension
pnpm dev
```

---

## 🎨 Customizing Annotation Styling

Edit the CSS in `src/entrypoints/content.ts`:

```css
ruby.word-wise-korean rt {
  font-size: 0.55em;      /* Adjust translation size */
  color: #667eea;         /* Change color */
  font-weight: 600;       /* Adjust weight */
  line-height: 1;         /* Vertical spacing */
}

/* Optional highlight under words */
ruby.word-wise-highlight {
  background: linear-gradient(transparent 70%, rgba(102, 126, 234, 0.12) 70%);
  border-radius: 2px;
  padding: 0 1px;
}
```

---

## 🌐 Translation Services for Batch Processing

### Free Options:
- **Google Translate API** (Free tier: 500k chars/month)
- **ChatGPT/Claude** (Free tier available)
- **Papago API** (Great for Korean, free tier exists)

### Using the Batch Translation Script:

```bash
# Set your API key (OpenAI example)
export OPENAI_API_KEY="sk-..."

# Run batch translation
node scripts/batch-translate.js src/assets/topik-vocab.json

# This will update missing Chinese/Japanese translations
```

See the script for other API providers (Anthropic, Google, etc.)

---

## 📈 File Size Estimates

| Word Count | File Size (JSON) | Gzipped | Load Time |
|------------|------------------|---------|-----------|
| 243 | 25 KB | ~8 KB | < 1ms |
| 800 | 82 KB | ~27 KB | < 5ms |
| 3,000 | 310 KB | ~103 KB | < 20ms |
| 6,000 | 620 KB | ~207 KB | < 40ms |

**Conclusion**: Even 6,000 words is very manageable! ✅

---

## ✅ Quality Control

Before adding words, verify:
- [ ] Correct Korean spelling (including spacing)
- [ ] Accurate part of speech (noun/verb/adjective/etc.)
- [ ] Natural translations (not machine-literal)
- [ ] Appropriate TOPIK level assignment
- [ ] Consistent JSON formatting

---

## 🧪 Testing Your Expanded Vocabulary

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
- "Added X annotations" (should increase)

---

## 🎯 Usage in Extension

These source files are **not** loaded by the extension. They are:
1. Parsed by `pdf-to-vocab.js` to create JSON
2. Output to `src/assets/topik-vocab-from-pdf.json`
3. Manually moved to `src/assets/topik-vocab.json`
4. Bundled into the extension at build time

---

## 📜 Sources & Attribution

- **TOPIK I & II Lists**: [Tammy Korean (learning-korean.com)](https://learning-korean.com/)
- **License**: Educational use - check source website for specific terms
- **Credit**: Thank you to Tammy Korean for providing free TOPIK vocabulary resources!

---

## 🗺️ Recommended Workflow

### Phase 1: Get Core Vocabulary ✅ COMPLETED
1. ✅ Downloaded TOPIK I word list (1,671 words)
2. ✅ Parsed and imported 1,668 unique words
3. ✅ Added to `topik-vocab.json`

### Phase 2: Expand to Full TOPIK II (PDF) ✅ COMPLETED
1. ✅ Downloaded TOPIK II additions (2,662 words)
2. ✅ Parsed and imported 2,660 unique words
3. ✅ Merged with existing file → **4,341 total words**

### Phase 2.5: Extend via Web Scraping (koreantopik.com) ✅ COMPLETED
1. ✅ Scraped TOPIK II vocabulary from koreantopik.com using `scrape-topik2-3900.py`
2. ✅ Generated `src/assets/topik2-3900-vocab.json` (~3,900 entries)
3. ✅ Merged into `topik-vocab.json` using `merge-topik2-vocab.py`
4. ✅ Deduplicated (277 entries) and translation quality pass (260 verbose prefixes stripped) → **6,065 total words**

### Phase 3: Conjugation Handling ✅ IMPLEMENTED
1. ✅ Stem extraction algorithm handles most cases
2. ✅ Supports 30+ common verb/adjective endings
3. ✅ Fallback matching for edge cases

### Phase 4: Translation Quality (Optional - Future)
1. Run batch translation for Chinese/Japanese
2. Manual review and correction
3. User testing and refinement

---

## 🚀 Next Steps (Quick Wins)

**1 Hour Project:**
1. Download a TOPIK I CSV from TOPIK Guide
2. Use ChatGPT to convert to JSON format
3. Merge with current file using `csv-to-vocab.js --merge`
4. → You'll have even more words!

**1 Week Project (Carefully Curated):**
1. Get official TOPIK word lists (I-VI)
2. Professional translation review
3. Add common conjugations
4. User testing and refinement
5. → You'll have 6,000+ words!

---

For more information on the vocabulary management scripts, see [scripts/README.md](../scripts/README.md).
