/**
 * Korean stem extraction and conjugation matching utilities
 * Handles verb/adjective conjugations to match dictionary forms
 */

// Common verb/adjective endings to strip for stem matching
const VERB_ENDINGS = [
  // Present tense
  '습니다', '입니다', 'ㅂ니다',
  '어요', '아요', '여요',
  '어', '아', '여',
  '은', '는', '를',
  
  // Past tense
  '었습니다', '았습니다', '였습니다',
  '었어요', '았어요', '였어요',
  '었어', '았어', '였어',
  '었다', '았다', '였다',
  
  // Future/modifier
  '을', '를', '은', '는',
  '겠습니다', '겠어요', '겠어',
  
  // Connectors
  '고', '지만', '거나', '면서',
  '어서', '아서', '여서',
  '니까', '으니까',
  
  // Other forms
  '지', '게', '도록',
];

// Sort by length (longest first) for correct matching
VERB_ENDINGS.sort((a, b) => b.length - a.length);

/**
 * Extract stem from a conjugated Korean verb/adjective
 * Returns possible stems that might match dictionary forms
 */
export function extractStems(word: string): string[] {
  const stems = new Set<string>();
  
  // Original word
  stems.add(word);
  
  // If word ends with 다, remove it (dictionary form)
  if (word.endsWith('다')) {
    stems.add(word.slice(0, -1));
  }
  
  // Try removing common endings
  for (const ending of VERB_ENDINGS) {
    if (word.endsWith(ending) && word.length > ending.length) {
      const stem = word.slice(0, -ending.length);
      stems.add(stem);
      
      // Some verbs need 다 added back for dictionary lookup
      if (!stem.endsWith('다')) {
        stems.add(stem + '다');
      }
    }
  }
  
  return Array.from(stems);
}

/**
 * Generate common conjugated forms from a dictionary form
 * Used to expand vocabulary with common variations
 */
export function generateConjugations(dictionaryForm: string): string[] {
  if (!dictionaryForm.endsWith('다')) {
    return [dictionaryForm];
  }
  
  const stem = dictionaryForm.slice(0, -1);
  const lastChar = stem[stem.length - 1];
  const hasVowel = hasLastVowel(lastChar);
  
  const forms = new Set([dictionaryForm]);
  
  // Common conjugations based on vowel harmony
  if (hasVowel) {
    // 아/어 forms (bright vowels: ㅏ, ㅗ)
    if (['ㅏ', 'ㅗ'].includes(getLastVowel(lastChar))) {
      forms.add(stem + '아요');
      forms.add(stem + '아');
      forms.add(stem + '았어요');
      forms.add(stem + '았습니다');
    } else {
      // Dark vowels
      forms.add(stem + '어요');
      forms.add(stem + '어');
      forms.add(stem + '었어요');
      forms.add(stem + '었습니다');
    }
  }
  
  // Common forms for all verbs/adjectives
  forms.add(stem + '습니다');
  forms.add(stem + '고');
  forms.add(stem + '지만');
  forms.add(stem + '어서');
  forms.add(stem + '니까');
  forms.add(stem + '는');
  forms.add(stem + '은');
  forms.add(stem + '을');
  
  return Array.from(forms);
}

/**
 * Check if the last character of a stem ends with a vowel
 */
function hasLastVowel(char: string): boolean {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return false;
  
  const jong = code % 28;
  return jong === 0; // No final consonant = ends with vowel
}

/**
 * Get the vowel from the last syllable
 */
function getLastVowel(char: string): string {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return '';
  
  const jung = Math.floor((code % 588) / 28);
  const vowels = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  
  return vowels[jung] || '';
}

/**
 * Check if a word could be a conjugated form of a base word
 */
export function couldBeConjugationOf(word: string, baseForm: string): boolean {
  if (word === baseForm) return true;
  
  const stems = extractStems(word);
  
  // Check if any extracted stem matches the base form's stem
  const baseStem = baseForm.endsWith('다') ? baseForm.slice(0, -1) : baseForm;
  
  return stems.some(stem => {
    const cleanStem = stem.endsWith('다') ? stem.slice(0, -1) : stem;
    return cleanStem === baseStem || stem === baseForm;
  });
}
