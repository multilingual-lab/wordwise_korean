# Vocabulary Data & Customization Guide

This directory contains the raw source text files for TOPIK vocabulary and instructions for extending the vocabulary database.

---

## 📁 Original Sources

The raw source files have been processed and deleted. The vocabulary is fully consolidated in `src/assets/topik-vocab.json`.

| Source | Words | Notes |
|---|---|---|
| [TOPIK I — Tammy Korean](https://learning-korean.com/elementary/20210101-10466/) | 1,671 | PDF word list |
| [TOPIK II — Tammy Korean](https://learning-korean.com/intermediate/20220630-12696/) | 2,662 | PDF word list |
| [koreantopik.com](https://koreantopik.com/) | ~3,900 | Scraped via `scrape-topik2-3900.py` |

After merging, deduplication, and quality pass: **6,064 words** in `src/assets/topik-vocab.json`.

---

## 📊 Current Status

**✅ Completed: 6,064 words (after deduplication and quality pass)**
- TOPIK I (Level 1): 1,578 words
- TOPIK II (Level 2): 4,487 words

| Level | Words | Verbs/Adj (ending in 다) | Expressions |
|-------|-------|------------------------|-------------|
| TOPIK I | 1,578 | ~400 | ~50 |
| TOPIK II | 4,487 | ~1,350 | ~190 |
| **Total** | **6,064** | **~1,750** | **~240** |

**Next Steps (Optional):**
- ✅ Chinese/Japanese translations via Azure OpenAI batch translation
- ✅ Verb/adjective conjugation matching
- Add user custom vocabulary feature
- Expand further using KRDICT API or additional word lists

---

## 🎨 Customizing Vocabulary

### Manual Editing

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

### Batch Translation

```powershell
# Auto-translate missing zh/ja using Azure OpenAI
$env:AZURE_OPENAI_KEY="<your-key>"
node scripts/batch-translate.js
```

See [scripts/README.md](../scripts/README.md) for detailed documentation on all scripts.

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
1. Download word list (usually Excel/CSV or JSON)
2. Manually add entries to `src/assets/topik-vocab.json` following the existing schema, then run `pnpm update-counts` and `pnpm test`

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

The vocabulary is already fully built. The txt files in this directory are kept as source references only.

To re-scrape and re-merge the TOPIK II extended list (e.g. to pick up new words from koreantopik.com):

```powershell
# Re-scrape from koreantopik.com
python scripts/scrape-topik2-3900.py   # outputs src/assets/topik2-3900-vocab.json

# Merge into topik-vocab.json
python scripts/merge-topik2-vocab.py

# Sync counts + verify
pnpm update-counts
pnpm test
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

## 🌐 Batch Translation (Azure OpenAI)

### Running the Script:

```powershell
# Set your Azure OpenAI key
$env:AZURE_OPENAI_KEY="<your-key>"

# Run batch translation (reads topik-vocab.json, writes topik-vocab-translated.json)
node scripts/batch-translate.js

# Review output, then replace
Move-Item src/assets/topik-vocab-translated.json src/assets/topik-vocab.json -Force
```

See [scripts/README.md](../scripts/README.md) for full details.

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

These source files are **not** loaded by the extension. They are kept as reference text for the original TOPIK word lists. The processed vocabulary lives in `src/assets/topik-vocab.json`, which is bundled into the extension at build time.

---

## 📜 Sources & Attribution

- **TOPIK I word list**: [Tammy Korean — Elementary](https://learning-korean.com/elementary/20210101-10466/)
- **TOPIK II word list**: [Tammy Korean — Intermediate](https://learning-korean.com/intermediate/20220630-12696/)
- **TOPIK II extended list**: [koreantopik.com](https://koreantopik.com/) (scraped via `scrape-topik2-3900.py`)
- **License**: Educational use — check source websites for specific terms

---

## 🗺️ Recommended Workflow

### Phase 1–2.5: Vocabulary Build ✅ COMPLETED
1. ✅ TOPIK I (Tammy Korean PDF) — 1,668 words
2. ✅ TOPIK II (Tammy Korean PDF) — merged to 4,341 words
3. ✅ TOPIK II extended (koreantopik.com scrape) — deduplicated + quality pass → **6,064 total words**

Source files have been deleted; vocabulary is in `src/assets/topik-vocab.json`.

### Phase 3: Conjugation Handling ✅ IMPLEMENTED
1. ✅ Stem extraction algorithm handles most cases
2. ✅ Supports 30+ common verb/adjective endings
3. ✅ Fallback matching for edge cases

### Phase 4: Translation Quality ✅ COMPLETED
1. ✅ Batch translation for English, Chinese, and Japanese via Azure OpenAI
2. ✅ Quality pass — verbose prefixes stripped, synonyms deduped, tilde-descriptions removed

---

## 🚀 Next Steps (Quick Wins)

**1 Hour Project:**
1. Download a TOPIK I CSV from TOPIK Guide
2. Manually add missing entries to `src/assets/topik-vocab.json` (or use ChatGPT to batch-convert to the JSON schema)
3. Run `pnpm update-counts && pnpm test`
4. → You'll have even more words!

**1 Week Project (Carefully Curated):**
1. Get official TOPIK word lists (I-VI)
2. Professional translation review
3. Add common conjugations
4. User testing and refinement
5. → You'll have 6,000+ words!

---

For more information on the vocabulary management scripts, see [scripts/README.md](../scripts/README.md).
