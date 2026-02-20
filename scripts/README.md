# Vocabulary Management Scripts

This directory contains tools for managing and expanding the TOPIK vocabulary.

## Available Scripts

### 1. `csv-to-vocab.js` - Convert CSV to Vocabulary JSON

Converts CSV files to the vocabulary JSON format used by the extension.

**Usage:**
```bash
node scripts/csv-to-vocab.js <csv-file> [options]

Options:
  --merge           Merge with existing vocabulary (no duplicates)
  --output <file>   Custom output filename
```

**Examples:**
```bash
# Convert standalone file
node scripts/csv-to-vocab.js topik1.csv

# Merge with existing vocabulary
node scripts/csv-to-vocab.js topik1.csv --merge

# Custom output name
node scripts/csv-to-vocab.js topik1.csv --output my-vocab.json
```

**CSV Format:**
```csv
word,level,pos,en,zh,ja
안녕하세요,1,expression,Hello,你好,こんにちは
```

**Minimum format** (will need translation later):
```csv
word,level,en
안녕하세요,1,Hello
```

---

### 2. `batch-translate.js` - Auto-translate Missing Languages

Uses ChatGPT API to fill in missing Chinese/Japanese translations.

**Setup:**
```bash
# Get API key from https://platform.openai.com/api-keys
# Windows:
$env:OPENAI_API_KEY="sk-..."

# Mac/Linux:
export OPENAI_API_KEY="sk-..."
```

**Usage:**
```bash
node scripts/batch-translate.js [vocab-file] [options]

Options:
  --langs zh,ja    Languages to translate (default: zh,ja)
  --batch 20       Batch size (default: 20)
```

**Examples:**
```bash
# Translate current vocabulary
node scripts/batch-translate.js src/assets/topik-vocab.json

# Only translate to Chinese
node scripts/batch-translate.js src/assets/topik-vocab.json --langs zh

# Smaller batches (if hitting rate limits)
node scripts/batch-translate.js src/assets/topik-vocab.json --batch 10
```

**Cost estimate:** ~$0.10-0.50 for 800 words using gpt-4o-mini

---

### 3. `pdf-to-vocab.js` - Parse PDF Text Extracts

Parses vocabulary from text extracted from TOPIK vocabulary PDFs.

**Usage:**
```bash
node scripts/pdf-to-vocab.js <text-file> [options]

Options:
  --level N     Set TOPIK level (1 for TOPIK I, 2 for TOPIK Ⅱ)
  --merge       Merge with existing vocabulary
```

**Examples:**
```bash
# Parse TOPIK I vocabulary
node scripts/pdf-to-vocab.js data/topik-1671-words.txt --level 1

# Parse TOPIK II and merge with TOPIK I
node scripts/pdf-to-vocab.js data/topik-2662-words.txt --level 2 --merge
```

**How to extract text from PDF:**
1. Open PDF in browser or PDF reader
2. Press Ctrl+A (Select All)
3. Press Ctrl+C (Copy)
4. Paste into a text file, save as UTF-8
5. Save in `data/` folder
6. Run the parser

**Supported format:** Handles columnar "No. 한글 English" format from learning-korean.com PDFs.

**Source files:** Already included in `data/` folder:
- `data/topik-1671-words.txt` - TOPIK I vocabulary
- `data/topik-2662-words.txt` - TOPIK II vocabulary

---

### 4. `scrape-topik2-3900.py` - Scrape Extended TOPIK II Vocabulary

Fetches the TOPIK II 3,900-word vocabulary from koreantopik.com and generates a JSON file.

**Usage:**
```bash
python scripts/scrape-topik2-3900.py
```

**Output:** `src/assets/topik2-3900-vocab.json`

**Note:** Requires network access to koreantopik.com. This script was already run — output is integrated into `topik-vocab.json`. Re-run only if you want to refresh the source data.

---

### 5. `merge-topik2-vocab.py` - Merge Scraped TOPIK II Vocabulary

Merges `src/assets/topik2-3900-vocab.json` (scraped TOPIK II words) into `src/assets/topik-vocab.json`, deduplicating by Korean word.

**Usage:**
```bash
python scripts/merge-topik2-vocab.py
```

**Result:** Updates `src/assets/topik-vocab.json` in-place. After running both scripts the vocabulary grows to ~6,065 words (1,578 TOPIK I + 4,487 TOPIK II, after deduplication and quality pass).

**Note:** Already applied — current `topik-vocab.json` reflects the merged and quality-audited result.

---

## Complete Workflow Example

### Starting from a CSV file:

```bash
# 1. Convert CSV to JSON (outputs src/assets/topik-vocab-imported.json)
node scripts/csv-to-vocab.js my-topik-words.csv --merge

# 2. Translate missing languages (Chinese/Japanese)
$env:OPENAI_API_KEY="sk-..."
node scripts/batch-translate.js src/assets/topik-vocab-imported.json

# 3. Review and apply
# Check the output file first
Get-Content src/assets/topik-vocab-imported.json | Select-Object -First 20

# If good, merge into main vocab:
node scripts/csv-to-vocab.js my-topik-words.csv --merge --output topik-vocab.json

# 4. Run tests to verify data integrity
pnpm test

# 5. Rebuild extension
pnpm dev
```

### Real-world example:

```bash
# Download TOPIK vocabulary PDFs from learning-korean.com
# Extract text to files, then:

# Parse TOPIK I
node scripts/pdf-to-vocab.js topik-1671-words.txt --level 1

# Parse TOPIK II and merge
node scripts/pdf-to-vocab.js topik-2662-words.txt --level 2 --merge

# Apply the merged vocabulary
Move-Item src/assets/topik-vocab-from-pdf.json src/assets/topik-vocab.json -Force

# Result: merged into topik-vocab.json (~6,065 words)
```

---

## Troubleshooting

### CSV Encoding Issues
Make sure your CSV is UTF-8 encoded:
```bash
# Windows PowerShell - convert to UTF-8
Get-Content input.csv | Set-Content -Encoding UTF8 output.csv

# Or use a text editor:
# - VS Code: "Save with Encoding" → UTF-8
# - Notepad++: Encoding → Convert to UTF-8
```

### API Rate Limits
If you hit rate limits with OpenAI:
- Reduce batch size: `--batch 10`
- Add delays in the script (already has 1s between batches)
- Use a different API key tier

### Verification
Check vocabulary loaded correctly:
```bash
# Count words
node -e "console.log(require('./src/assets/topik-vocab.json').length)"

# Check for duplicates
node -e "const v=require('./src/assets/topik-vocab.json'); console.log('Total:', v.length, 'Unique:', new Set(v.map(w=>w.word)).size)"
```

---

## Tips

**Where to find TOPIK word lists:**
- https://www.topikguide.com/ (Excel/CSV downloads)
- https://talktomeinkorean.com/curriculum/
- https://quizlet.com/ (search "TOPIK", export to CSV)
- Anki decks (export as CSV)

**CSV Format Tips:**
- Always include header row
- Use UTF-8 encoding
- Quote fields containing commas: `"hello, world"`
- Keep it simple: just `word,level,en` is enough!

**Cost Optimization:**
- Use gpt-4o-mini (current default) - 10x cheaper than gpt-4
- Batch size 20-50 words optimal
- ~1,600 words costs $0.40-$1.00
- ~4,300 words costs $1.00-$2.50
- Chinese/Japanese together in one API call

**Quality Control:**
- Manually review AI translations for cultural accuracy
- Check verb/adjective dictionary forms end in 다
- Verify TOPIK level assignments
- Test on real Korean content

---

## Need Help?

See [data/README.md](../data/README.md) for vocabulary data sources and the complete regeneration workflow.
