import type { VocabEntry, UserConfig } from '@/types';
import vocabularyData from '@/assets/topik-vocab.json';

/**
 * Common Korean grammar particles that should not be annotated
 * These are functional words, not vocabulary to learn
 */
const COMMON_PARTICLES = new Set([
  // Topic/Subject markers
  '은', '는', '이', '가',
  // Object markers
  '을', '를',
  // Possessive
  '의',
  // Location/Time
  '에', '에서', '에게', '한테',
  // Also/Too
  '도',
  // And/With
  '와', '과', '하고', '랑', '이랑',
  // Direction/Method
  '로', '으로',
  // From
  '부터', '에서',
  // To/Until
  '까지',
  // But
  '만',
  // Contrast
  '보다',
]);

/**
 * Load vocabulary filtered by user's selected level
 * Level 1 = TOPIK I only (~1,600 words)
 * Level 2 = TOPIK II only (~2,700 words)
 * Level 3 = All levels (~4,300 words)
 */
export function loadVocabulary(config: UserConfig): Map<string, VocabEntry> {
  const entries = vocabularyData as VocabEntry[];
  const vocabMap = new Map<string, VocabEntry>();

  for (const entry of entries) {
    // Skip common grammar particles
    if (COMMON_PARTICLES.has(entry.word)) continue;

    // Filter by level
    if (config.level === 1 && entry.level !== 1) continue;
    if (config.level === 2 && entry.level !== 2) continue;
    // Level 3 includes all

    vocabMap.set(entry.word, entry);
  }

  return vocabMap;
}

/**
 * Get translation for a word based on target language
 */
export function getTranslation(
  entry: VocabEntry,
  language: UserConfig['targetLanguage']
): string {
  return entry.translations[language];
}

/**
 * Check if text contains Korean characters
 */
export function containsKorean(text: string): boolean {
  // Korean Unicode range: 가-힣 (Hangul syllables)
  // Also includes: ㄱ-ㅎ (consonants) and ㅏ-ㅣ (vowels)
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);
}
