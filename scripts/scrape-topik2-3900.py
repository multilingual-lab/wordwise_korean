#!/usr/bin/env python3
"""
Scrape TOPIK II 3900 vocabulary from koreantopik.com and generate JSON.
Usage: python scripts/scrape-topik2-3900.py
"""
import re
import json
import time
import urllib.request
import urllib.parse
import os
import sys

BASE_URL = "https://www.koreantopik.com"
INDEX_URL = "https://www.koreantopik.com/2024/09/complete-topik-2-vocabulary-list-3900.html"
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                           "src", "assets", "topik2-3900-vocab.json")
EXISTING_VOCAB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                                    "src", "assets", "topik-vocab.json")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def fetch_url(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read().decode('utf-8')
    except Exception as e:
        print(f"  ERROR fetching {url}: {e}")
        return None

def strip_html(s):
    """Remove HTML tags and decode entities."""
    s = re.sub(r'<[^>]+>', ' ', s)
    s = s.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&nbsp;', ' ')
    s = s.replace('&#39;', "'").replace('&quot;', '"')
    return re.sub(r'\s+', ' ', s).strip()

def get_subpage_links(html):
    """Extract links to sub-pages containing 100 words each."""
    # Match links to the vocabulary sub-pages
    links = re.findall(
        r'href=["\']?(https://www\.koreantopik\.com/[^"\'>\s]+3900[^"\'>\s]*)["\']?',
        html
    )
    # Also match general vocab page links
    links2 = re.findall(
        r'href=["\']?(https://www\.koreantopik\.com/2023/[^"\'>\s]+vocabulary[^"\'>\s]*)["\']?',
        html
    )
    all_links = list(dict.fromkeys(links + links2))
    print(f"Found {len(all_links)} sub-page links")
    return all_links

def parse_vocab_page(html, page_url=""):
    """
    Parse Korean vocabulary from a single page.
    The pages typically have format: Korean word - English translation
    in a structured table or list.
    """
    words = []

    # Strategy 0: koreantopik.com specific format
    # Table columns: # | Vocab | Meaning | Example | Translation
    # NOTE: HTML has no closing </tr> or </td> tags - split by <tr to get rows
    # Two variants:
    #   A) Korean text in <span lang=ko>  (some pages)
    #   B) Korean text directly in <td>   (other pages)
    tr_sections = re.split(r'<tr[^>]*>', html, flags=re.IGNORECASE)
    if len(tr_sections) > 3:  # Table with at least a header + data rows
        for section in tr_sections[2:]:  # skip [0]=pre-table, [1]=header row
            # Split by <td to get columns
            td_sections = re.split(r'<td[^>]*>', section, flags=re.IGNORECASE)
            # Column layout: [0]=pre, [1]=#, [2]=Vocab(Korean), [3]=Meaning, [4]=Example, [5]=Translation
            if len(td_sections) >= 4:
                vocab_cell = td_sections[2]
                meaning_cell = td_sections[3]

                # Variant A: Korean word in <span lang=ko>
                ko_match = re.search(r'<span[^>]+lang=["\']?ko["\']?[^>]*>(.*?)</span>', vocab_cell, re.DOTALL | re.IGNORECASE)
                if ko_match:
                    korean = strip_html(ko_match.group(1)).strip(' -')
                    korean = re.sub(r'^[-\s]+', '', korean).strip()
                else:
                    # Variant B: Korean text directly in td (remove all HTML tags)
                    korean = strip_html(vocab_cell).strip(' -')
                    korean = re.sub(r'^[-\s\d\.]+', '', korean).strip()

                # Meaning: remove HTML, strip parentheses
                meaning = strip_html(meaning_cell).strip()
                meaning = re.sub(r'^\((.+)\)$', r'\1', meaning)  # unwrap (text)

                if korean and meaning and re.search(r'[\uAC00-\uD7A3]', korean):
                    if not re.search(r'[\uAC00-\uD7A3]', meaning):  # meaning should be non-Korean
                        words.append((korean, meaning))

        if words:
            return words

    # Try to find table data first
    # Look for table rows with Korean + English
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL | re.IGNORECASE)
    if rows:
        for row in rows:
            cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.DOTALL | re.IGNORECASE)
            if len(cells) >= 2:
                col1 = strip_html(cells[0])
                col2 = strip_html(cells[1])
                # Check if first column has Korean characters
                if re.search(r'[\uAC00-\uD7A3]', col1) and col2 and not col2.startswith('No'):
                    # Handle numbered entries like "1. 가격"
                    korean = re.sub(r'^\d+[\.\)]\s*', '', col1).strip()
                    if korean and re.search(r'[\uAC00-\uD7A3]', korean):
                        words.append((korean, col2))
                        continue
                # If 4 columns: No, Korean, No, Korean patterns
                if len(cells) >= 4:
                    for i in [0, 2]:
                        k = strip_html(cells[i])
                        e = strip_html(cells[i+1]) if i+1 < len(cells) else ''
                        k = re.sub(r'^\d+[\.\)]\s*', '', k).strip()
                        if k and re.search(r'[\uAC00-\uD7A3]', k) and e:
                            words.append((k, e))
    
    # Also look for numbered list pattern: "1. 가격 - price" or "1. 가격\nprice"
    # First find ordered list items
    li_items = re.findall(r'<li[^>]*>(.*?)</li>', html, re.DOTALL | re.IGNORECASE)
    for item in li_items:
        text = strip_html(item)
        # Pattern: number. Korean - English  OR  Korean - English
        m = re.match(r'^(?:\d+[\.\)]\s*)?([\uAC00-\uD7A3\s]+?)\s*[-–—:]\s*(.+)$', text)
        if m:
            korean = m.group(1).strip()
            english = m.group(2).strip()
            if korean and english and len(english) < 150:
                words.append((korean, english))
    
    # Look for definition list patterns
    dt_items = re.findall(r'<dt[^>]*>(.*?)</dt>\s*<dd[^>]*>(.*?)</dd>', html, re.DOTALL | re.IGNORECASE)
    for dt, dd in dt_items:
        korean = strip_html(dt)
        english = strip_html(dd)
        if re.search(r'[\uAC00-\uD7A3]', korean):
            words.append((korean, english))
    
    # Look for paragraph/span patterns: Korean (English) or Korean - English  
    if not words:
        # Extract paragraphs/divs content
        paras = re.findall(r'<(?:p|div|span)[^>]*>\s*(?:<(?:span|b|strong)[^>]*>)?([\uAC00-\uD7A3][^<]{0,30})</(?:span|b|strong)>?\s*[-–—\(]\s*([a-zA-Z][^<]{2,100}?)\s*</(?:p|div|span)>', html)
        for k, v in paras:
            k = k.strip()
            v = v.strip().rstrip(')')
            if k and v:
                words.append((k, v))
    
    # As a fallback: find all Korean-English pairs with dash
    if not words:
        text = strip_html(html)
        # Pattern: number. Korean - English
        matches = re.findall(r'(?:^|\n)\s*\d+[\.\)]\s*([\uAC00-\uD7A3][^\n\-–—]{1,20})\s*[-–—]\s*([a-zA-Z][^\n]{2,100})', text)
        for k, v in matches:
            words.append((k.strip(), v.strip()))
    
    return words

def determine_pos(word, translation):
    """Determine part of speech."""
    if word.endswith('다'):
        if re.match(r'^(be|is|are|am)\s+', translation.lower()):
            return 'adjective'
        return 'verb'
    elif re.match(r'^(hello|goodbye|thank|please|sorry|excuse|yes|no|congratulations)', translation.lower()):
        return 'expression'
    return 'noun'

def words_to_vocab_entries(words, level=2):
    """Convert (korean, english) pairs to vocab entry dicts."""
    entries = []
    seen = set()
    for korean, english in words:
        # Clean
        korean = korean.strip()
        english = english.strip().rstrip('.,;')
        if not korean or not english:
            continue
        if not re.search(r'[\uAC00-\uD7A3]', korean):
            continue
        if korean in seen:
            continue
        seen.add(korean)
        
        pos = determine_pos(korean, english)
        entries.append({
            "word": korean,
            "level": level,
            "pos": pos,
            "translations": {
                "en": english
            }
        })
    return entries

ALL_SUBPAGE_URLS = [
    "https://www.koreantopik.com/2023/05/3900-vocabulary-words-for-topik-2-with.html",        # 1-100
    "https://www.koreantopik.com/2023/05/3900-vocabulary-words-for-topik-2-with_29.html",     # 101-200
    "https://www.koreantopik.com/2023/06/3900-vocabulary-words-for-topik-2-with.html",        # 201-300
    "https://www.koreantopik.com/2023/06/3900-vocabulary-words-for-topik-2-with_4.html",      # 301-400
    "https://www.koreantopik.com/2023/06/3900-vocabulary-words-for-topik-2-with_7.html",      # 401-500
    "https://www.koreantopik.com/2023/06/3900-vocabulary-words-for-topik-2-with_14.html",     # 501-600
    "https://www.koreantopik.com/2023/06/3900-vocabulary-words-for-topik-2-with_25.html",     # 601-700
    "https://www.koreantopik.com/2023/07/3900-vocabulary-words-for-topik-2-with.html",        # 701-800
    "https://www.koreantopik.com/2023/07/3900-vocabulary-words-for-topik-2-with_17.html",     # 801-900
    "https://www.koreantopik.com/2023/07/3900-vocabulary-words-for-topik-2-with_29.html",     # 901-1000
    "https://www.koreantopik.com/2023/08/3900-vocabulary-words-for-topik-2-with.html",        # 1001-1100
    "https://www.koreantopik.com/2023/09/3900-vocabulary-words-for-topik-2-with.html",        # 1101-1200
    "https://www.koreantopik.com/2023/09/the-12011300th-topik-2-vocabulary-with.html",        # 1201-1300
    "https://www.koreantopik.com/2023/10/the-13011400th-topik-2-vocabulary-with.html",        # 1301-1400
    "https://www.koreantopik.com/2023/11/the-14011500th-topik-2-vocabulary-with.html",        # 1401-1500
    "https://www.koreantopik.com/2023/12/the-15011600th-topik-2-vocabulary-with.html",        # 1501-1600
    "https://www.koreantopik.com/2023/12/the-16011700th-topik-2-vocabulary-with.html",        # 1601-1700
    "https://www.koreantopik.com/2023/12/the-17011800th-topik-2-vocabulary-with.html",        # 1701-1800
    "https://www.koreantopik.com/2024/01/the-18011900th-topik-2-vocabulary-with.html",        # 1801-1900
    "https://www.koreantopik.com/2024/01/the-19012000th-topik-2-vocabulary-with.html",        # 1901-2000
    "https://www.koreantopik.com/2024/02/the-20012100th-topik-2-vocabulary-with.html",        # 2001-2100
    "https://www.koreantopik.com/2024/05/the-21012200th-topik-2-vocabulary-with.html",        # 2101-2200
    "https://www.koreantopik.com/2024/05/the-22012300th-topik-2-vocabulary-with.html",        # 2201-2300
    "https://www.koreantopik.com/2024/05/the-23012400th-topik-2-vocabulary-with.html",        # 2301-2400
    "https://www.koreantopik.com/2024/05/the-24012500th-topik-2-vocabulary-with.html",        # 2401-2500
    "https://www.koreantopik.com/2024/06/the-25012600th-topik-2-vocabulary-with.html",        # 2501-2600
    "https://www.koreantopik.com/2024/06/the-26012700th-topik-2-vocabulary-with.html",        # 2601-2700
    "https://www.koreantopik.com/2024/06/the-27012800th-topik-2-vocabulary-with.html",        # 2701-2800
    "https://www.koreantopik.com/2024/06/the-28012900th-topik-2-vocabulary-with.html",        # 2801-2900
    "https://www.koreantopik.com/2024/06/the-29013000th-topik-2-vocabulary-with.html",        # 2901-3000
    "https://www.koreantopik.com/2024/07/the-30013100th-topik-2-vocabulary-with.html",        # 3001-3100
    "https://www.koreantopik.com/2024/07/the-30013100th-topik-2-vocabulary-with_13.html",     # 3101-3200
    "https://www.koreantopik.com/2024/07/the-32013300th-topik-2-vocabulary-with.html",        # 3201-3300
    "https://www.koreantopik.com/2024/07/the-33013400th-topik-2-vocabulary-with.html",        # 3301-3400
    "https://www.koreantopik.com/2024/08/the-34013500th-topik-2-vocabulary-with.html",        # 3401-3500
    "https://www.koreantopik.com/2024/09/the-35013600th-topik-2-vocabulary-with.html",        # 3501-3600
    "https://www.koreantopik.com/2024/09/the-36013700th-topik-2-vocabulary-with.html",        # 3601-3700
    "https://www.koreantopik.com/2024/09/the-37013800th-topik-2-vocabulary-with.html",        # 3701-3800
    "https://www.koreantopik.com/2024/09/the-38013900th-topik-2-vocabulary-with.html",        # 3801-3900
]

def main():
    print("="*60)
    print("TOPIK II 3900 Vocabulary Scraper")
    print("="*60)

    subpage_links = ALL_SUBPAGE_URLS
    print(f"\nUsing {len(subpage_links)} hardcoded sub-page URLs (1–3900)")
    print(f"\nFetching {len(subpage_links)} sub-pages...")
    all_words = []
    
    for i, url in enumerate(subpage_links, 1):
        print(f"  [{i}/{len(subpage_links)}] {url}")
        page_html = fetch_url(url)
        if page_html:
            words = parse_vocab_page(page_html, url)
            print(f"    -> {len(words)} words found")
            all_words.extend(words)
        time.sleep(0.5)  # Polite delay
    
    if not all_words:
        print("\nERROR: No words extracted from any page!")
        sys.exit(1)
    
    print(f"\nTotal word pairs collected: {len(all_words)}")
    
    # Convert to vocab entries
    entries = words_to_vocab_entries(all_words, level=2)
    print(f"Unique vocab entries: {len(entries)}")
    
    # Save to output file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved to: {OUTPUT_FILE}")
    
    # Show sample
    print("\nSample entries:")
    for e in entries[:5]:
        print(f"  {e['word']} ({e['pos']}) -> {e['translations']['en']}")
    
    return entries

if __name__ == '__main__':
    main()
