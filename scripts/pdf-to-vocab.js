import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse TOPIK vocabulary from text extracted from PDF
 * 
 * This script assumes you've already extracted text from the PDF.
 * 
 * To extract text from PDF:
 * 1. Open PDF in browser
 * 2. Copy all text (Ctrl+A, Ctrl+C)
 * 3. Paste into a text file (e.g., topik-words.txt)
 * 4. Run: node scripts/pdf-to-vocab.js topik-words.txt
 */

function parseTopikText(text, defaultLevel = 1) {
  const vocabulary = [];
  const lines = text.split('\n');
  
  let currentLevel = defaultLevel; // Track current TOPIK level
  
  // This PDF has format: No. 한글 English No. 한글 English
  // Examples:
  // 1 가게 store, shop 41 감사하다 thank, appreciate
  // 2 가격 price 42 감사합니다 thank you
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 2) continue;
    
    // Check for section headers
    if (/TOPIK\s*I+\s*Vocabulary/i.test(trimmed)) {
      if (/Intermediate|Advanced/i.test(trimmed)) {
        currentLevel = 2;
      } else {
        currentLevel = 1;
      }
      continue;
    }
    
    // Skip pure header lines
    if (/^(No\.|한글|English|TOPIK|Level|Page|\d+\s*$)/i.test(trimmed)) continue;
    
    // Parse lines with format: number word translation [number word translation]
    // Match pattern: digit(s) Korean-chars English-words [repeat]
    const entries = [];
    
    // Split by numbers followed by Korean characters
    const parts = trimmed.split(/(\d+\s+[가-힣]+\s+[^0-9가-힣][^\d]*?)(?=\d+\s+[가-힣]|$)/);
    
    for (const part of parts) {
      if (!part.trim()) continue;
      
      // Match: number Korean English
      const match = part.match(/^\s*\d+\s+([가-힣]+)\s+(.+?)$/);
      if (match) {
        const [, word, translation] = match;
        
        // Clean translation
        let cleanTranslation = translation
          .replace(/\s+\d+\s*$/, '') // Remove trailing numbers
          .replace(/[,~]+$/, '') // Remove trailing punctuation
          .trim();
        
        if (cleanTranslation && word.length > 0) {
          // Determine part of speech
          let pos = 'noun';
          if (word.endsWith('다')) {
            // Check if verb or adjective
            if (cleanTranslation.match(/^(be|is|are|am)\s+(good|bad|big|small|many|few|happy|sad|beautiful|ugly|hot|cold|warm|cool|high|low|long|short|fast|slow|same|different)/i)) {
              pos = 'adjective';
            } else {
              pos = 'verb';
            }
          } else if (cleanTranslation.match(/^(hello|goodbye|thank you|please|sorry|excuse me)/i)) {
            pos = 'expression';
          }
          
          entries.push({
            word: word,
            level: currentLevel,
            pos: pos,
            translations: {
              en: cleanTranslation,
              zh: cleanTranslation, // Placeholder
              ja: cleanTranslation, // Placeholder
            }
          });
        }
      }
    }
    
    vocabulary.push(...entries);
  }
  
  return vocabulary;
}

/**
 * Remove duplicates and sort
 */
function cleanVocabulary(vocab) {
  const seen = new Set();
  const unique = [];
  
  for (const entry of vocab) {
    if (!seen.has(entry.word)) {
      seen.add(entry.word);
      unique.push(entry);
    }
  }
  
  // Sort by level, then alphabetically
  unique.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.word.localeCompare(b.word, 'ko');
  });
  
  return unique;
}

// Main execution
if (process.argv.length < 3) {
  console.log('PDF to Vocabulary Converter');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/pdf-to-vocab.js <file.txt> [--level N] [--merge]');
  console.log('');
  console.log('Options:');
  console.log('  --level N    Set TOPIK level (1 for TOPIK I, 2 for TOPIK II)');
  console.log('  --merge      Merge with existing vocabulary');
  console.log('');
  console.log('Step 1: Extract text from PDF');
  console.log('  - Open PDF file');
  console.log('  - Press Ctrl+A (select all)');
  console.log('  - Press Ctrl+C (copy)');
  console.log('  - Paste into a text file (e.g., topik-words.txt)');
  console.log('  - Ensure the file is saved as UTF-8');
  console.log('');
  console.log('Step 2: Run this script');
  console.log('  node scripts/pdf-to-vocab.js topik-1671-words.txt --level 1');
  console.log('  node scripts/pdf-to-vocab.js topik-2662-words.txt --level 2 --merge');
  process.exit(0);
}

const textFile = process.argv[2];

// Parse command line options
const levelIndex = process.argv.indexOf('--level');
const defaultLevel = levelIndex >= 0 && process.argv[levelIndex + 1] ? parseInt(process.argv[levelIndex + 1]) : 1;

try {
  console.log(`📖 Reading text file: ${textFile}`);
  const text = fs.readFileSync(textFile, 'utf-8');
  
  console.log(`🔄 Parsing vocabulary (Level ${defaultLevel})...`);
  let vocab = parseTopikText(text, defaultLevel);
  
  console.log(`✅ Found ${vocab.length} words`);
  
  console.log('🧹 Cleaning duplicates...');
  vocab = cleanVocabulary(vocab);
  
  console.log(`✅ Cleaned to ${vocab.length} unique words`);
  
  // Check if should merge
  const shouldMerge = process.argv.includes('--merge');
  let finalVocab = vocab;
  
  if (shouldMerge) {
    const existingPath = path.join(__dirname, '..', 'src', 'assets', 'topik-vocab.json');
    if (fs.existsSync(existingPath)) {
      console.log('🔗 Merging with existing vocabulary...');
      const existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
      const existingWords = new Set(existing.map(w => w.word));
      const merged = [...existing];
      
      let added = 0;
      for (const word of vocab) {
        if (!existingWords.has(word.word)) {
          merged.push(word);
          added++;
        }
      }
      
      finalVocab = merged;
      console.log(`✅ Added ${added} new words. Total: ${finalVocab.length}`);
    }
  }
  
  // Write output
  const outputPath = path.join(__dirname, '..', 'src', 'assets', 'topik-vocab-from-pdf.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalVocab, null, 2), 'utf-8');
  
  console.log('');
  console.log('📊 Summary:');
  console.log(`  Total words: ${finalVocab.length}`);
  console.log(`  Level 1: ${finalVocab.filter(w => w.level === 1).length}`);
  console.log(`  Level 2: ${finalVocab.filter(w => w.level === 2).length}`);
  console.log('');
  console.log(`✅ Saved to: ${outputPath}`);
  console.log('');
  console.log('⚠️  Note: Chinese and Japanese translations are placeholders.');
  console.log('Run batch translation to fill them:');
  console.log(`  node scripts/batch-translate.js ${outputPath}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.code === 'ENOENT') {
    console.log('');
    console.log('File not found. Make sure to:');
    console.log('1. Extract text from PDF and save it');
    console.log('2. Save as UTF-8 encoding');
    console.log('3. Run this script with the correct filename');
  }
  process.exit(1);
}
