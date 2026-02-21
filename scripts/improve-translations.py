#!/usr/bin/env python3
"""Improve English translations in topik-vocab.json.

Two-pass cleanup applied to every entry:

Pass 1 – Simplify verbose comma-separated translations
  - Strips all but the first term  ("simple, easy" → "simple")
  - Drops Korean romanization prefixes  ("Kochujang, red pepper paste" → "red pepper paste")
  - Applies word-level overrides for romanizations / sentence-style phrases

Pass 2 – Shorten long translations via curated override table
  - Replaces lengthy descriptive strings with concise idiomatic equivalents
  - e.g. "baked bread with red beans inside (street food)" → "fish-shaped pastry"

Both passes also mirror the result to zh/ja fields that currently hold English
placeholder text (identified by absence of CJK characters).
"""

import json
import os
import re

VOCAB_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'topik-vocab.json')

# ---------------------------------------------------------------------------
# Pass 1: overrides applied before comma-stripping
# ---------------------------------------------------------------------------
SIMPLIFY_OVERRIDES: dict[str, str] = {
    # Korean foods — replace romanization with English description
    '갈비':       'spareribs',
    '갈비탕':     'spareribs soup',
    '감자탕':     'pork & potato soup',
    '고추장':     'red pepper paste',
    '비빔밥':     'bibimbap',
    '불고기':     'bulgogi',
    '소주':       'soju',
    '한복':       'hanbok',
    # Sentence-style / awkward phrases
    '글쎄요':    "I don't know",
    '그렇다':    "that's right",
    '그렇구나':  'I see',
    '자':        'here we go',
    '웬일':      'what brings you here',
    # Ambiguous / over-explained entries
    '무통장':    'ATM deposit',
    '양반':      'nobility',
    '대한민국':  'South Korea',
    '한강':      'Han River',
    '윷놀이':    'Yunnori',
    '이비인후과': 'ENT clinic',
    '의식주':    'food, clothing & shelter',
    '콜록콜록':  'cough cough',
    '양식':      'western cuisine',
    '조선':      'Joseon (Korea)',
    '국립':      'national',
}

# Romanization tokens that appear as the *first* comma-term → skip, use the rest
KNOWN_ROMANIZATIONS: set[str] = {
    'Galvi', 'Galbitang', 'Gamjatang', 'Kochujang', 'Bulgogi',
    'Bibimbap', 'Hanbok', 'Yangban', 'Hangang', 'Yunnori',
}

# ---------------------------------------------------------------------------
# Pass 2: curated overrides for long / descriptive translations
# ---------------------------------------------------------------------------
SHORTEN_OVERRIDES: dict[str, str] = {
    '붕어빵':       'fish-shaped pastry',
    '복날':         'hottest dog-day',
    '비빔냉면':     'spicy cold noodles',
    '온돌':         'ondol (floor heating)',
    '김장':         'kimchi-making season',
    '한옥':         'hanok (traditional house)',
    '한의사':       'traditional medicine doctor',
    '냉방병':       'air conditioning illness',
    '큰집':         "eldest son's home",
    '추석':         'Chuseok (harvest festival)',
    '아리랑':       'Arirang (folk song)',
    '삼일절':       'Independence Movement Day',
    '일석이조':     'two birds, one stone',
    '원':           'won',
    '장모':         'mother-in-law',
    '장인':         'father-in-law',
    '탈춤':         'mask dance',
    '형님':         'big brother (honorific)',
    '이삿짐':       'moving belongings',
    '김포공항':     'Gimpo Airport',
    '안녕히 가세요': 'goodbye (to departing)',
    '안녕히 계세요': 'goodbye (to staying)',
    '오빠':         'older brother (fem.)',
    '건더기':       'solid soup ingredients',
    '떠나가다':     'leave, go away',
    '언니':         'older sister (fem.)',
    '꼬박꼬박':     'consistently',
    '노처녀':       'old unmarried woman',
    '보고회':       'briefing session',
    '엿':           'Korean taffy',
    '의식주':       'food, clothing & shelter',
    '중순':         'mid-month',
    '생신':         'birthday (honorific)',
    '형':           'older brother (masc.)',
    '개강':         'start of semester',
    '남녀노소':     'people of all ages',
    '닭갈비':       'spicy stir-fried chicken',
    '분수':         "one's place",
    '산부인과':     'OB/GYN',
    '현모양처':     'ideal wife and mother',
    '누나':         'older sister (masc.)',
    '국악':         'Korean traditional music',
    '그제':         'day before yesterday',
    '내용물':       'contents',
    '병문안':       'hospital visit',
    '신기다':       'put shoes on someone',
    '잇따르다':     'follow one after another',
    '전세':         'deposit-based lease',
    '총무과':       'general affairs dept.',
    '추천서':       'recommendation letter',
    '친오빠':       'biological older brother',
    '퇴원':         'hospital discharge',
    '한지':         'Korean traditional paper',
    '된장':         'soybean paste',
    '등산복':       'hiking gear',
    '경영학':       'business administration',
    '귀국':         'return home',
    '밤새다':       'stay up all night',
    '밥상':         'dining table',
    '본문':         'main text',
    '신분증':       'ID card',
    '이상형':       'ideal type',
    '일교차':       'daily temp. range',
    '정신없다':     'in a frenzy',
    '책임감':       'sense of responsibility',
    '친언니':       'biological older sister',
    '팥빙수':       'shaved ice dessert',
    '고마웠습니다': 'thank you (past)',
    '모레':         'day after tomorrow',
    '수저':         'spoon and chopsticks',
    '가계부':       'household ledger',
    '국제결혼':     'international marriage',
    '만족감':       'satisfaction',
    '문병':         'hospital visit',
    '영양제':       'nutritional supplement',
    '정성껏':       'wholeheartedly',
    '불다':         'blow',
    '전자사전':     'e-dictionary',
    '중학생':       'middle schooler',
    '노총각':       'old bachelor',
    '농산물':       'farm produce',
    '동서남북':     'all directions',
    '본론':         'main topic',
    '어떠하다':     'how is it',
    '외갓집':       'maternal home',
    '잡채':         'japchae',
    '재테크':       'investment tips',
    '체하다':       'upset stomach',
    '쿨쿨':         '"zzz" (snoring)',
    '합격자':       'successful candidates',
    '떠나오다':     'leave and come here',
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
_CJK_RE = re.compile(r'[\u3000-\u9fff\uac00-\ud7ff]')


def has_cjk(s: str) -> bool:
    return bool(_CJK_RE.search(s))


def simplify(word: str, trans: str) -> str:
    """Pass 1: strip verbose comma-separated alternatives."""
    if not trans or ',' not in trans:
        return trans
    if word in SIMPLIFY_OVERRIDES:
        return SIMPLIFY_OVERRIDES[word]
    parts = [p.strip() for p in trans.split(',')]
    first = parts[0]
    if first in KNOWN_ROMANIZATIONS:
        return ', '.join(parts[1:]).strip()
    return first.rstrip('.')


def shorten(word: str, trans: str) -> str:
    """Pass 2: replace known long translations with concise equivalents."""
    return SHORTEN_OVERRIDES.get(word, trans)


def apply_to_non_cjk_langs(entry: dict, new_en: str) -> None:
    """Mirror a new English value to zh/ja if they contain no real CJK text."""
    for lang in ['zh', 'ja']:
        val = entry['translations'].get(lang, '')
        if val and not has_cjk(val):
            entry['translations'][lang] = new_en


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    with open(VOCAB_PATH, encoding='utf-8') as f:
        data = json.load(f)

    changed = 0
    for entry in data:
        word = entry.get('word', '')
        orig_en = entry['translations'].get('en', '')

        # Pass 1
        new_en = simplify(word, orig_en)
        # Pass 2
        new_en = shorten(word, new_en)

        if new_en != orig_en:
            entry['translations']['en'] = new_en
            apply_to_non_cjk_langs(entry, new_en)
            changed += 1
            print(f'  {word}: "{orig_en}" -> "{new_en}"')

    print(f'\nTotal changed: {changed}')

    with open(VOCAB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'Saved to {VOCAB_PATH}')


if __name__ == '__main__':
    main()
