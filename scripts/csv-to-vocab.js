import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert CSV to TOPIK vocabulary JSON format
 * 
 * Expected CSV format (with header):
 * word,level,pos,en,zh,ja
 * 
 * Or simpler format:
 * word,level,en
 */

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const vocabulary = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < 2) continue; // Skip malformed lines
    
    const entry = {};
    
    // Map CSV columns to our format
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      if (!value) return;
      
      switch(header.toLowerCase()) {
        case 'word':
        case 'korean':
        case 'hangul':
          entry.word = value;
          break;
        case 'level':
        case 'topik':
        case 'topik_level':
          entry.level = parseInt(value) || 1;
          break;
        case 'pos':
        case 'part of speech':
        case 'type':
          entry.pos = value.toLowerCase();
          break;
        case 'en':
        case 'english':
        case 'translation':
          if (!entry.translations) entry.translations = {};
          entry.translations.en = value;
          break;
        case 'zh':
        case 'chinese':
          if (!entry.translations) entry.translations = {};
          entry.translations.zh = value;
          break;
        case 'ja':
        case 'japanese':
          if (!entry.translations) entry.translations = {};
          entry.translations.ja = value;
          break;
      }
    });
    
    // Validate required fields
    if (entry.word && entry.translations?.en) {
      // Set defaults
      if (!entry.level) entry.level = 1;
      if (!entry.pos) entry.pos = 'noun';
      if (!entry.translations.zh) entry.translations.zh = entry.translations.en; // Fallback
      if (!entry.translations.ja) entry.translations.ja = entry.translations.en; // Fallback
      
      vocabulary.push(entry);
    }
  }
  
  return vocabulary;
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Merge new vocabulary with existing, avoiding duplicates
 */
function mergeVocabulary(existing, newWords) {
  const existingWords = new Set(existing.map(w => w.word));
  const merged = [...existing];
  
  for (const word of newWords) {
    if (!existingWords.has(word.word)) {
      merged.push(word);
      existingWords.add(word.word);
    }
  }
  
  return merged;
}

// Main execution
if (process.argv.length < 3) {
  console.log('Usage: node csv-to-vocab.js <csv-file> [--merge] [--output <file>]');
  console.log('');
  console.log('Examples:');
  console.log('  node csv-to-vocab.js topik1.csv');
  console.log('  node csv-to-vocab.js topik1.csv --merge');
  console.log('  node csv-to-vocab.js topik1.csv --output my-vocab.json');
  console.log('');
  console.log('CSV Format:');
  console.log('  word,level,pos,en,zh,ja');
  console.log('  안녕하세요,1,expression,Hello,你好,こんにちは');
  console.log('');
  console.log('Minimal CSV Format (will use ChatGPT for missing translations):');
  console.log('  word,level,en');
  console.log('  안녕하세요,1,Hello');
  process.exit(0);
}

const csvFile = process.argv[2];
const shouldMerge = process.argv.includes('--merge');
const outputIndex = process.argv.indexOf('--output');
const outputFile = outputIndex !== -1 
  ? process.argv[outputIndex + 1] 
  : 'topik-vocab-imported.json';

try {
  // Read CSV
  console.log(`📖 Reading CSV file: ${csvFile}`);
  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  
  // Parse CSV
  console.log('🔄 Parsing CSV...');
  const newVocab = parseCSV(csvContent);
  console.log(`✅ Parsed ${newVocab.length} words`);
  
  let finalVocab = newVocab;
  
  // Merge if requested
  if (shouldMerge) {
    const existingPath = path.join(__dirname, '..', 'src', 'assets', 'topik-vocab.json');
    
    if (fs.existsSync(existingPath)) {
      console.log('🔗 Merging with existing vocabulary...');
      const existing = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
      finalVocab = mergeVocabulary(existing, newVocab);
      console.log(`✅ Merged! Total: ${finalVocab.length} words`);
    }
  }
  
  // Sort by level, then alphabetically
  finalVocab.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.word.localeCompare(b.word, 'ko');
  });
  
  // Write output
  const outputPath = path.join(__dirname, '..', 'src', 'assets', outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(finalVocab, null, 2), 'utf-8');
  
  console.log('');
  console.log('📊 Summary:');
  console.log(`  Total words: ${finalVocab.length}`);
  console.log(`  Level 1: ${finalVocab.filter(w => w.level === 1).length}`);
  console.log(`  Level 2: ${finalVocab.filter(w => w.level === 2).length}`);
  console.log(`  Level 3+: ${finalVocab.filter(w => w.level >= 3).length}`);
  console.log('');
  console.log(`✅ Output saved to: ${outputPath}`);
  console.log('');
  
  // Check for missing translations
  const missingZh = finalVocab.filter(w => !w.translations.zh || w.translations.zh === w.translations.en);
  const missingJa = finalVocab.filter(w => !w.translations.ja || w.translations.ja === w.translations.en);
  
  if (missingZh.length > 0 || missingJa.length > 0) {
    console.log('⚠️  Missing translations detected:');
    if (missingZh.length > 0) console.log(`  Chinese: ${missingZh.length} words need translation`);
    if (missingJa.length > 0) console.log(`  Japanese: ${missingJa.length} words need translation`);
    console.log('');
    console.log('💡 Run: node scripts/batch-translate.js to fill missing translations');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
