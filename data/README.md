# Vocabulary Source Data

This directory contains the raw source text files for TOPIK vocabulary.

## Files

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

## How to Extract Text from PDF

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

## Text Format Example

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

## Usage in Extension

These source files are **not** loaded by the extension. They are:
1. Parsed by `pdf-to-vocab.js` to create JSON
2. Output to `src/assets/topik-vocab-from-pdf.json`
3. Manually moved to `src/assets/topik-vocab.json`
4. Bundled into the extension at build time

## Regenerating Vocabulary

To rebuild the vocabulary from scratch:

```bash
# Start fresh
node scripts/pdf-to-vocab.js data/topik-1671-words.txt --level 1

# Merge TOPIK II
node scripts/pdf-to-vocab.js data/topik-2662-words.txt --level 2 --merge

# Apply to extension
Move-Item src/assets/topik-vocab-from-pdf.json src/assets/topik-vocab.json -Force

# Rebuild extension
pnpm dev
```

## Sources & Attribution

- **TOPIK I & II Lists**: [Tammy Korean (learning-korean.com)](https://learning-korean.com/)
- **License**: Educational use - check source website for specific terms
- **Credit**: Thank you to Tammy Korean for providing free TOPIK vocabulary resources!

## Statistics

| Level | Words | Verbs/Adj (ending in 다) | Expressions |
|-------|-------|------------------------|-------------|
| TOPIK I | 1,578 | ~400 | ~50 |
| TOPIK Ⅱ | 2,729 | ~800 | ~100 |
| **Total** | **4,341** | **~1,200** | **~150** |

## Updating Vocabulary

To add more words or update translations:

1. **Edit source files** in this directory, or
2. **Use CSV converter**: `node scripts/csv-to-vocab.js mywords.csv --merge`
3. **Batch translate**: `node scripts/batch-translate.js src/assets/topik-vocab.json`

See [scripts/README.md](../scripts/README.md) for detailed documentation.
