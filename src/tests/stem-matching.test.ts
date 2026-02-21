/**
 * Korean Stem Extraction & Conjugation Matching — Comprehensive Tests
 *
 * Tests are organised by:
 *   A. Helpers & vocab maps (Level 1 / Level 2 / Level 3 / All)
 *   B. Core conjugation resolution (full vocab)
 *   C. Noun/verb collision prevention (POS-aware lookup)
 *   D. 는/은 single-char heuristic (서는, 가는, 오는 vs 학교는, 친구는)
 *   E. 하다 irregular contractions
 *   F. Level-filtered behaviour (Level 2 = TOPIK II only)
 *   G. couldBeConjugationOf() round-trips
 *   H. extractStems() output shape
 *   I. Known limitations (documented, not bugs)
 *
 * Rules that must hold:
 *   1. verb-only endings  -> noun candidates blocked in both Pass 1 AND Pass 2
 *   2. 는/은 + single-char stem -> treated as verb modifier (verbOnly:true)
 *   3. 는/은 + multi-char stem  -> unconstrained (noun+topic allowed)
 *   4. Level filters are exclusive: L2 = TOPIK II words only (L1 verbs absent)
 *   5. When verb dictionary form is absent from level-filtered map,
 *      annotator returns NO annotation -- never a wrong noun annotation
 */

import { describe, it, expect } from 'vitest';
import {
  extractStems,
  extractStemsForLookup,
  couldBeConjugationOf,
  VERB_POS,
} from '@/utils/korean-stem';
import rawVocab from '@/assets/topik-vocab.json';
import type { VocabEntry } from '@/types';

// --- A. Vocab helpers ---------------------------------------------------------

const ALL_VOCAB = rawVocab as VocabEntry[];

/** Build a level-filtered map identical to vocabulary-loader.ts logic */
function buildMap(level: 1 | 2 | 3): Map<string, VocabEntry> {
  const map = new Map<string, VocabEntry>();
  for (const e of ALL_VOCAB) {
    if (level === 1 && e.level !== 1) continue;
    if (level === 2 && e.level !== 2) continue;
    map.set(e.word, e);
  }
  return map;
}

const L1 = buildMap(1);  // TOPIK I only
const L2 = buildMap(2);  // TOPIK II only
const L3 = buildMap(3);  // All levels

/**
 * Simulates the annotator two-pass POS-aware lookup against a given vocab map.
 * Pass 1: respects verbOnly -- rejects nouns/pronouns when a verb-only ending was stripped.
 * Pass 2: accepts any pos when entry.pos is absent (data gap), but still blocks
 *         nouns/pronouns when verbOnly:true.
 */
function resolve(word: string, map: Map<string, VocabEntry>): string | undefined {
  const exact = map.get(word);
  if (exact) return word;

  const candidates = extractStemsForLookup(word);

  // Pass 1 & 2 share the same POS guard -- verbOnly nouns are always blocked
  for (const { stem, verbOnly } of candidates) {
    const entry = map.get(stem);
    if (!entry) continue;
    if (verbOnly && entry.pos != null && !VERB_POS.has(entry.pos)) continue;
    return stem;
  }

  return undefined;
}

/** Resolve against full L3 vocab (default for non-level-specific tests) */
const r = (w: string) => resolve(w, L3);

// --- B. Core conjugation resolution (full vocab) -----------------------------

describe('Past tense (-었/았어요) resolves to dictionary form', () => {
  it('먹었어요 -> 먹다', () => expect(r('먹었어요')).toBe('먹다'));
  it('읽었어요 -> 읽다', () => expect(r('읽었어요')).toBe('읽다'));
  it('받았어요 -> 받다', () => expect(r('받았어요')).toBe('받다'));
  it('살았어요 -> 살다  (not 살 "flesh")', () => expect(r('살았어요')).toBe('살다'));
});

describe('Present tense (-아/어요) resolves to dictionary form', () => {
  it('좋아요    -> 좋다',     () => expect(r('좋아요')).toBe('좋다'));
  it('재미있어요 -> 재미있다', () => expect(r('재미있어요')).toBe('재미있다'));
  it('맛있어요   -> 맛있다',  () => expect(r('맛있어요')).toBe('맛있다'));
});

describe('Connector forms resolve to dictionary form', () => {
  it('먹지만   -> 먹다',     () => expect(r('먹지만')).toBe('먹다'));
  it('먹어서   -> 먹다',     () => expect(r('먹어서')).toBe('먹다'));
  it('공부하고  -> 공부하다', () => expect(r('공부하고')).toBe('공부하다'));
});

describe('Direct dictionary form matches exactly', () => {
  it('먹다', () => expect(r('먹다')).toBe('먹다'));
  it('크다', () => expect(r('크다')).toBe('크다'));
  it('학교', () => expect(r('학교')).toBe('학교'));
  it('친구', () => expect(r('친구')).toBe('친구'));
  it('음식', () => expect(r('음식')).toBe('음식'));
});

// --- C. Noun/verb collision prevention ---------------------------------------

describe('Verb-only endings: noun collision blocked, verb preferred', () => {
  it('가고     -> 가다  (not 가 "professional")', () => expect(r('가고')).toBe('가다'));
  it('서고     -> 서다  (not 서 "west")',          () => expect(r('서고')).toBe('서다'));
  it('배우니까  -> 배우다 (not 배우 "actor")',      () => expect(r('배우니까')).toBe('배우다'));
  it('살았어요  -> 살다  (not 살 "flesh")',         () => expect(r('살았어요')).toBe('살다'));
});

describe('Noun never annotated when verb is absent (no fallback to wrong noun)', () => {
  // Build a map with 서 noun present but 서다 verb deliberately removed
  it('서고 when 서다 absent -> undefined (not 서 "west")', () => {
    const m = new Map(L3);
    m.delete('서다');
    expect(resolve('서고', m)).toBeUndefined();
  });
  it('서는 when 서다 absent -> undefined (not 서 "west")', () => {
    const m = new Map(L3);
    m.delete('서다');
    expect(resolve('서는', m)).toBeUndefined();
  });
});

// --- D. 는/은 single-char heuristic ------------------------------------------

describe('는/은 + single-char stem -> verbOnly (verb modifier)', () => {
  it('서는 -> 서다  (서는 날 = the day one stands)', () => expect(r('서는')).toBe('서다'));
  it('가는 -> 가다  (가는 길 = the road one takes)', () => expect(r('가는')).toBe('가다'));
  it('서는 must NOT be 서 "west"', () => expect(r('서는')).not.toBe('서'));
  it('가는 must NOT be 가 "professional"', () => expect(r('가는')).not.toBe('가'));
});

describe('는/은 + multi-char stem -> noun+topic unconstrained', () => {
  it('친구는 -> 친구 (topic particle on noun)', () => expect(r('친구는')).toBe('친구'));
  it('학교는 -> 학교 (topic particle on noun)', () => expect(r('학교는')).toBe('학교'));
  it('음식은 -> 음식 (topic particle on noun)', () => expect(r('음식은')).toBe('음식'));
});

// --- E. 하다 irregular contractions ------------------------------------------

describe('하다 irregular: 해/했 forms map to 하다 base', () => {
  it('해요     -> 하다',      () => expect(r('해요')).toBe('하다'));
  it('했어요   -> 하다',      () => expect(r('했어요')).toBe('하다'));
  it('해서     -> 하다',      () => expect(r('해서')).toBe('하다'));
  it('공부해요  -> 공부하다',  () => expect(r('공부해요')).toBe('공부하다'));
  it('공부했어요 -> 공부하다', () => expect(r('공부했어요')).toBe('공부하다'));
});

// --- F. Level-filtered behaviour ---------------------------------------------

describe('Level 2 (TOPIK II only): L1 verbs absent, noun fallback blocked', () => {
  // 서다 (stand) is L1 -> NOT in L2; 서 (west) is L2 but must be blocked
  it('서고 at L2 -> undefined', () => expect(resolve('서고', L2)).toBeUndefined());
  it('서는 at L2 -> undefined', () => expect(resolve('서는', L2)).toBeUndefined());
  it('서고 at L2 must NOT be 서 "west"', () => expect(resolve('서고', L2)).not.toBe('서'));
  it('서는 at L2 must NOT be 서 "west"', () => expect(resolve('서는', L2)).not.toBe('서'));

  // 배우다 (learn) is L2 -> IS in L2 map -> correct annotation
  it('배우니까 at L2 -> 배우다', () => expect(resolve('배우니까', L2)).toBe('배우다'));

  // Direct noun still resolves (no stem stripping needed)
  it('서 alone at L2 -> 서 "west" (direct exact match, no stripping)', () => {
    expect(resolve('서', L2)).toBe('서');
  });

  // 살았어요: both 살다 (L1 verb) and 살 (L1 noun) absent from L2 map
  it('살았어요 at L2 -> undefined (L1 words absent)', () => {
    expect(resolve('살았어요', L2)).toBeUndefined();
  });
});

describe('Level 1 (TOPIK I only): L2 verbs absent, L1 verbs work', () => {
  it('서고  at L1 -> 서다', () => expect(resolve('서고',  L1)).toBe('서다'));
  it('서는  at L1 -> 서다', () => expect(resolve('서는',  L1)).toBe('서다'));
  it('살았어요 at L1 -> 살다', () => expect(resolve('살았어요', L1)).toBe('살다'));

  // 배우다 is L2 -> absent; 배우 (actor) is L1 noun but verbOnly blocks it
  it('배우니까 at L1 -> undefined (배우다 absent; 배우 noun blocked)', () => {
    expect(resolve('배우니까', L1)).toBeUndefined();
  });
  it('배우니까 at L1 must NOT be 배우 "actor"', () => {
    expect(resolve('배우니까', L1)).not.toBe('배우');
  });
});

describe('Level 3 (all words): every collision resolved correctly', () => {
  it('서고     -> 서다',   () => expect(resolve('서고',  L3)).toBe('서다'));
  it('서는     -> 서다',   () => expect(resolve('서는',  L3)).toBe('서다'));
  it('배우니까  -> 배우다', () => expect(resolve('배우니까', L3)).toBe('배우다'));
  it('살았어요  -> 살다',  () => expect(resolve('살았어요', L3)).toBe('살다'));
  it('가고     -> 가다',   () => expect(resolve('가고',  L3)).toBe('가다'));
});

// --- G. couldBeConjugationOf() -----------------------------------------------

describe('couldBeConjugationOf()', () => {
  it('먹었어요 is conjugation of 먹다',     () => expect(couldBeConjugationOf('먹었어요', '먹다')).toBe(true));
  it('좋아요 is conjugation of 좋다',       () => expect(couldBeConjugationOf('좋아요', '좋다')).toBe(true));
  it('공부하고 is conjugation of 공부하다', () => expect(couldBeConjugationOf('공부하고', '공부하다')).toBe(true));
  it('먹었어요 is NOT conjugation of 자다', () => expect(couldBeConjugationOf('먹었어요', '자다')).toBe(false));
  it('same word is trivially a conjugation', () => expect(couldBeConjugationOf('먹다', '먹다')).toBe(true));
});

// --- H. extractStems() output shape ------------------------------------------

describe('extractStems() output', () => {
  it('always includes the original word', () => expect(extractStems('공부했어요')).toContain('공부했어요'));
  it('strips 다 from dictionary form',    () => expect(extractStems('먹다')).toContain('먹'));
  it('adds 다 to bare stems',             () => expect(extractStems('먹었어요')).toContain('먹다'));
  it('returns unique values',             () => {
    const s = extractStems('먹었어요');
    expect(s.length).toBe(new Set(s).size);
  });
});

// --- I. Known limitations (documented, not bugs) -----------------------------

describe('Known limitations', () => {
  it('가서 (가다 + ㅏ-contraction) -> undefined (Unicode contraction unhandled)', () => {
    // 아서 is a listed ending but 가서 != 가 + 아서 at Unicode syllable level
    expect(r('가서')).toBeUndefined();
  });
  it('completely unknown word -> undefined', () => expect(r('블라블라블라')).toBeUndefined());
  it('non-Korean text -> undefined',         () => expect(r('hello')).toBeUndefined());
});
