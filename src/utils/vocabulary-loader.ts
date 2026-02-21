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
  // Bound nouns — only meaningful in grammatical context, not as standalone words
  '수',  // ~ 할 수 있다/없다 (ability marker)
]);

/**
 * Load vocabulary filtered by user's selected level
 * Level 1 = TOPIK I only
 * Level 2 = TOPIK II only
 * Level 3 = All levels
 *
 * ⚠️  WORD COUNT SYNC NOTE:
 * topik-vocab.json is the single source of truth for counts.
 * After any vocab changes run:  pnpm update-counts
 * This patches docs/index.html with live counts.
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
 * English synonym clusters.
 * When two terms in a comma-separated translation belong to the same cluster,
 * only the first encountered is kept. The first element of each cluster is the
 * canonical (preferred) display form.
 *
 * Rules for inclusion: both terms must be interchangeable in ALL contexts,
 * or be British/American English variants of the same concept.
 */
const EN_SYNONYM_CLUSTERS: ReadonlyArray<ReadonlyArray<string>> = [
  // British / American English variants
  ['autumn', 'fall'],
  ['university', 'college'],
  // Conjunctions
  ['but', 'however'],
  ['so', 'thus'],
  // Degree adverbs
  ['very', 'extremely'],
  ['almost', 'nearly'],
  ['much', 'far', 'a lot'],
  // Common verb synonyms
  ['answer', 'reply'],
  ['choose', 'select'],
  ['gather', 'get together'],
  ['return', 'go back'],
  ['come back', 'come home'],
  ['help', 'assistance'],
  ['finish', 'end'],
  ['meeting', 'gathering'],
  ['usually', 'normally'],
  ['simple', 'easy'],
  ['alcohol', 'liquor'],
  ['hiking', 'mountain-climbing'],
  ['schedule', 'timetable'],
  ['stop', 'cease'],
  ['want', 'wish', 'desire'],
  ['disadvantage', 'shortcoming', 'drawback'],
  ['ruin', 'spoil', 'mess up'],
  ['significance', 'meaning', 'sense'],
  ['strange', 'weird', 'funny'],    // 이상하다: "funny" here means odd/strange
  ['for a bit', 'for a while', 'a little'],
  ['confusion', 'mess', 'disorder'],
  ['husband and wife', 'married couple'],
  ['boast', 'brag'],
  ['old story', 'old tale'],
  ['of this kind', 'of this sort'],
  ['right', 'correct'],
  ['other', 'another'],
  ['behind', 'towards the rear'],
  // Adverbs
  ['in advance', 'beforehand'],
  ['first', 'first of all'],
  ['immediately', 'soon', 'just', 'quickly'],
  ['washing dishes', 'dish-washing'],
];

/** Map from synonym term (lowercase) → canonical form (first in cluster) */
const EN_SYNONYM_MAP: ReadonlyMap<string, string> = (() => {
  const m = new Map<string, string>();
  for (const cluster of EN_SYNONYM_CLUSTERS)
    for (const term of cluster) m.set(term, cluster[0]);
  return m;
})();

/**
 * Clean a single raw translation string for display:
 *   1. Strip parenthetical notes: "(honorific form)", "(a local district)", "(s)"
 *   2. Collapse extra spaces
 */
function cleanPart(raw: string): string {
  return raw
    .replace(/\s*\([^)]*\)\s*/g, ' ') // replace (...) with a space
    .replace(/\s+/g, ' ')             // collapse multiple spaces
    .trim();
}

/**
 * Strip tilde-based meta-descriptions (e.g. "one of the ~", "~ piece(s)").
 * These are lexical notes in the vocab data, not useful display translations.
 *   - If some parts have no ~, drop all parts that contain ~.
 *   - If ALL parts contain ~, strip the ~ character itself from each part.
 */
function stripTildeParts(parts: string[]): string[] {
  const hasTilde = parts.map(p => p.includes('~'));
  const anyWithout = hasTilde.some(h => !h);
  if (anyWithout) {
    return parts.filter((_, i) => !hasTilde[i]);
  }
  // All have ~: strip ~ and clean up
  return parts.map(p => p.replace(/~/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/**
 * Get translation for a word based on target language.
 * For English, also:
 *   - strips parenthetical notes
 *   - removes synonymous duplicates from comma-separated lists
 */
export function getTranslation(
  entry: VocabEntry,
  language: UserConfig['targetLanguage']
): string {
  const raw = entry.translations[language];
  if (!raw) return '';

  // Only apply English post-processing
  if (language !== 'en') return raw;

  let parts = raw.split(',').map(s => cleanPart(s)).filter(Boolean);
  parts = stripTildeParts(parts);
  if (parts.length === 0) return raw; // safety fallback
  const kept: string[] = [];
  const seenCanonical = new Set<string>();

  for (const part of parts) {
    const canonical = EN_SYNONYM_MAP.get(part.toLowerCase()) ?? part.toLowerCase();
    if (!seenCanonical.has(canonical)) {
      seenCanonical.add(canonical);
      kept.push(part);
    }
  }

  return kept.join(', ');
}

/**
 * Check if text contains Korean characters
 */
export function containsKorean(text: string): boolean {
  // Korean Unicode range: 가-힣 (Hangul syllables)
  // Also includes: ㄱ-ㅎ (consonants) and ㅏ-ㅣ (vowels)
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);
}
