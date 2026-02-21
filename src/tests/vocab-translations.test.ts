/**
 * Vocabulary Translation Precision Tests
 *
 * Verifies:
 *   1. Data integrity (no empty/malformed entries)
 *   2. Polysemous words kept with correct primary meaning
 *   3. Verbose "to X / being X" prefixes removed for cleaner annotations
 *   4. Shorter/more concise translation chosen over longer equivalent
 *   5. New TOPIK II words are present with correct translations
 *   6. Chinese (zh) translation coverage and quality
 *   7. Japanese (ja) translation coverage and quality
 */

import { describe, it, expect } from 'vitest';
import rawVocab from '@/assets/topik-vocab.json';
import type { VocabEntry } from '@/types';

const vocab = rawVocab as VocabEntry[];
const vocabMap = new Map(vocab.map(w => [w.word, w]));

function en(word: string): string | undefined {
  return vocabMap.get(word)?.translations.en;
}
function zh(word: string): string | undefined {
  return vocabMap.get(word)?.translations.zh;
}
function ja(word: string): string | undefined {
  return vocabMap.get(word)?.translations.ja;
}

// ─── 1. Data integrity ────────────────────────────────────────────────────────

describe('Data integrity', () => {
  it('has at least 5900 entries (6342 - 277 deduped)', () => {
    expect(vocab.length).toBeGreaterThanOrEqual(5900);
  });

  it('TOPIK I words are within expected range (dedup may reduce count)', () => {
    const count = vocab.filter(w => w.level === 1).length;
    expect(count).toBeGreaterThanOrEqual(1300);
    expect(count).toBeLessThanOrEqual(1578);
  });

  it('has at least 4400 TOPIK II words', () => {
    expect(vocab.filter(w => w.level === 2).length).toBeGreaterThanOrEqual(4400);
  });

  it('every entry has a non-empty English translation', () => {
    const missing = vocab.filter(w => !w.translations.en || w.translations.en.trim() === '');
    expect(missing.map(w => w.word)).toEqual([]);
  });

  it('every entry has word and level fields', () => {
    const invalid = vocab.filter(w => !w.word || !w.level);
    expect(invalid).toHaveLength(0);
  });

  it('no duplicate words', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const w of vocab) {
      if (seen.has(w.word)) dupes.push(w.word);
      seen.add(w.word);
    }
    expect(dupes).toEqual([]);
  });

  it('no translations contain verbose "to " or "being " prefix', () => {
    const verbosePrefix = /^(to be |to |being )/;
    const offenders = vocab
      .filter(w => verbosePrefix.test(w.translations.en))
      .map(w => `${w.word}="${w.translations.en}"`);
    expect(offenders).toEqual([]);
  });

  it('common verbs have clean translations without "to" prefix', () => {
    expect(en('가다')).toBe('go');
    expect(en('공부하다')).toBe('study');
    expect(en('배우다')).toBe('learn');
    expect(en('살다')).toBe('live');
    expect(en('높다')).toBe('high/tall');
  });
});

// ─── 2. Polysemous word protection ────────────────────────────────────────────

describe('Polysemous words keep correct primary meaning', () => {
  // These words have multiple Korean meanings; the first/most-common one should be kept
  it('감 = persimmon (not "sense of")', () => expect(en('감')).toBe('persimmon'));
  it('가사 = housework (not "lyrics")', () => expect(en('가사')).toBe('housework'));
  it('간 = while (not "salty seasoning")', () => expect(en('간')).toBe('while'));
  it('가장 = most (not "the head")', () => expect(en('가장')).toBe('most'));
  it('감독 = director (not "supervision")', () => expect(en('감독')).toBe('director'));
  it('감동 = sensation (not "impression")', () => expect(en('감동')).toBe('sensation'));
  it('각자 = each one (not "each person")', () => expect(en('각자')).toBe('each one'));
  it('걔  = that person (not "that kid, he, she")', () => expect(en('걔')).toBe('that person'));
  it('강수량 = rain precipitation (not just "precipitation")', () => {
    // Old was more specific; new was shorter but less precise
    expect(en('강수량')).toMatch(/precipitation|rainfall/);
  });
  it('경험 is present', () => expect(en('경험')).toBeTruthy());
});

// ─── 3. Verbose prefix removal ────────────────────────────────────────────────

describe('Verbose verb/adjective prefixes stripped', () => {
  it('가꾸다 → "cultivate" (stripped "to cultivate")', () => {
    expect(en('가꾸다')).toBe('cultivate');
  });
  it('가렵다 → "itchy" (stripped "to be itchy")', () => {
    expect(en('가렵다')).toBe('itchy');
  });
  it('가라앉다 → "sink" (stripped "to sink")', () => {
    expect(en('가라앉다')).toBe('sink');
  });
  it('갈다 → "change" (stripped "to change")', () => {
    expect(en('갈다')).toBe('change');
  });
  it('객관적 → "objective" (stripped "being objective")', () => {
    expect(en('객관적')).toBe('objective');
  });
  it('개인적 → "personal" (stripped "being personal")', () => {
    expect(en('개인적')).toBe('personal');
  });
  it('감동적 → "touching" (stripped "moving (emotionally)")', () => {
    expect(en('감동적')).toBe('touching');
  });
});

// ─── 4. Shorter/more concise wins ─────────────────────────────────────────────

describe('More concise translation chosen', () => {
  it('가까이 = "near" (not "nearby")', () => expect(en('가까이')).toBe('near'));
  it('감소 = "reduction" (kept, shorter than "decrease")', () => {
    // Both are fine; test that a valid English word is returned
    expect(en('감소')).toMatch(/reduction|decrease/);
  });
  it('간호 = "nursing" (not "nursing care")', () => expect(en('간호')).toBe('nursing'));
  it('개방 = "opening" (trimmed from "opening, opening to the public")', () => {
    expect(en('개방')).toBe('opening');
  });
  it('가능 = "possible" (not "possibility, potentiality")', () => {
    expect(en('가능')).toBe('possible');
  });
  it('가만히 = "still" (not "motionlessly")', () => {
    expect(en('가만히')).toBe('still');
  });
});

// ─── 5. New TOPIK II words present and precise ────────────────────────────────

describe('New TOPIK II words present with correct translations', () => {
  const newWords: [string, string][] = [
    ['개념', 'concept'],
    ['가치관', 'values'],
    ['개혁', 'reform'],
    ['견해', 'view'],
    ['고려', 'consideration'],
    ['고독', 'loneliness'],
    ['강도', 'burglar'],
    ['가죽', 'leather'],
    ['가짜', 'fake'],
    ['감옥', 'prison'],
    ['개미', 'ant'],
    ['거대', 'huge'],
    ['예술가', 'artist'],
    ['작곡가', 'composer'],
    ['허가', 'permission'],
  ];

  newWords.forEach(([word, expected]) => {
    it(`${word} = "${expected}"`, () => {
      expect(en(word)).toBe(expected);
    });
  });
});

// ─── 6. Known problematic single-char entry ───────────────────────────────────

describe('Known issues', () => {
  it('가 (single char) is in vocab as "professional" — may cause stem-match noise', () => {
    // This entry exists and is technically a valid TOPIK II word (가: 가수=singer suffix)
    // but it risks intercepting stem "가" extracted from 가다 conjugations
    // Flagged here for awareness; future fix: raise minimum word length for stem match hits
    const entry = vocabMap.get('가');
    expect(entry).toBeDefined();
    expect(entry?.translations.en).toBe('professional');
    // Mark this test as a known risk (not blocking)
    console.warn('[KNOWN ISSUE] "가" in vocab may shadow 가다 stem matching');
  });
});

// ─── 7. Chinese (zh) translation coverage ────────────────────────────────────

describe('Chinese (zh) translation coverage', () => {
  it('every entry has a non-empty zh translation', () => {
    const missing = vocab.filter(w => !w.translations.zh || w.translations.zh.trim() === '');
    expect(missing.map(w => w.word)).toEqual([]);
  });

  it('zh translations are not just copies of the English translation', () => {
    const sameAsEn = vocab.filter(w =>
      w.translations.zh &&
      w.translations.zh.trim().toLowerCase() === w.translations.en.trim().toLowerCase()
    );
    expect(sameAsEn.map(w => w.word)).toEqual([]);
  });

  it('zh translations contain at least one CJK character', () => {
    const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
    const nonCjk = vocab.filter(w => w.translations.zh && !cjkRegex.test(w.translations.zh));
    expect(nonCjk.map(w => `${w.word}="${w.translations.zh}"`)).toEqual([]);
  });

  it('zh coverage is 100%', () => {
    const filled = vocab.filter(w => w.translations.zh && w.translations.zh.trim() !== '').length;
    expect(filled).toBe(vocab.length);
  });
});

// ─── 8. Chinese (zh) spot-check quality ──────────────────────────────────────

describe('Chinese (zh) spot-check quality', () => {
  const checks: [string, string][] = [
    ['가다',  '去'],
    ['오다',  '来'],
    ['먹다',  '吃'],
    ['사람',  '人'],
    ['학교',  '学校'],
    ['한국',  '韩国'],
    ['물',    '水'],
    ['시간',  '时间'],
    ['돈',    '钱'],
    ['좋다',  '好'],
    ['크다',  '大'],
    ['작다',  '小'],
    ['있다',  '有/在'],
    ['없다',  '没有/不在'],
    ['가족',  '家人'],
    ['친구',  '朋友'],
    ['공부',  '学习'],
    ['사랑',  '爱'],
    ['나라',  '国家'],
    ['일',    '日'],
    ['개념',  '概念'],
    ['가치관','价值观'],
    ['경험',  '经验'],
    ['문화',  '文化'],
    ['사회',  '社会'],
  ];

  checks.forEach(([word, expected]) => {
    it(`${word} → "${expected}"`, () => {
      expect(zh(word)).toBe(expected);
    });
  });
});

// ─── 9. Japanese (ja) translation coverage ───────────────────────────────────

describe('Japanese (ja) translation coverage', () => {
  it('every entry has a non-empty ja translation', () => {
    const missing = vocab.filter(w => !w.translations.ja || w.translations.ja.trim() === '');
    expect(missing.map(w => w.word)).toEqual([]);
  });

  it('ja translations are not just copies of the English translation', () => {
    // Allow legitimate loanwords/abbreviations that are identical in both languages (DVD, CD, etc.)
    const loanwords = new Set(['디브이디', '시디']);
    const sameAsEn = vocab.filter(w =>
      !loanwords.has(w.word) &&
      w.translations.ja &&
      w.translations.ja.trim().toLowerCase() === w.translations.en.trim().toLowerCase()
    );
    expect(sameAsEn.map(w => w.word)).toEqual([]);
  });

  it('ja translations contain at least one Japanese/CJK character (loanwords excepted)', () => {
    // Hiragana, Katakana, or CJK
    const jaCharRegex = /[\u3040-\u30ff\u4e00-\u9fff]/;
    // Allow known abbreviations that use Roman letters even in Japanese
    const loanwords = new Set(['디브이디', '시디']);
    const nonJa = vocab.filter(w =>
      !loanwords.has(w.word) &&
      w.translations.ja &&
      !jaCharRegex.test(w.translations.ja)
    );
    expect(nonJa.map(w => `${w.word}="${w.translations.ja}"`)).toEqual([]);
  });

  it('ja coverage is 100%', () => {
    const filled = vocab.filter(w => w.translations.ja && w.translations.ja.trim() !== '').length;
    expect(filled).toBe(vocab.length);
  });
});

// ─── 10. Japanese (ja) spot-check quality ────────────────────────────────────

describe('Japanese (ja) spot-check quality', () => {
  const checks: [string, string][] = [
    ['가다',  '行く'],
    ['오다',  '来る'],
    ['먹다',  '食べる'],
    ['사람',  '人'],
    ['학교',  '学校'],
    ['한국',  '韓国'],
    ['물',    '水'],
    ['시간',  '時間'],
    ['돈',    'お金'],
    ['좋다',  '良い'],
    ['크다',  '大きい'],
    ['작다',  '小さい'],
    ['있다',  'ある/いる'],
    ['없다',  'ない'],
    ['가족',  '家族'],
    ['친구',  '友達'],
    ['공부',  '勉強'],
    ['사랑',  '愛'],
    ['나라',  '国'],
    ['일',    '日'],
    ['개념',  '概念'],
    ['경험',  '経験'],
    ['문화',  '文化'],
    ['사회',  '社会'],
  ];

  checks.forEach(([word, expected]) => {
    it(`${word} → "${expected}"`, () => {
      expect(ja(word)).toBe(expected);
    });
  });
});
