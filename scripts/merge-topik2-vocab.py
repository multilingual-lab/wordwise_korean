#!/usr/bin/env python3
"""
Merge topik2-3900-vocab.json into topik-vocab.json.

Strategy:
- Keep all existing TOPIK I (level 1) entries unchanged
- For TOPIK II (level 2) entries:
  - If the word exists in both files, prefer the new file's translation
    (it has cleaner English from koreantopik.com)
  - If the word only exists in the new file, add it with zh/ja as ""
  - If the word only exists in the old file (level 2), keep it
- Keep level 3 entries unchanged
- Result: merged into topik-vocab.json (backup old first)
"""
import json
import shutil
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD_FILE = os.path.join(BASE, "src", "assets", "topik-vocab.json")
NEW_FILE = os.path.join(BASE, "src", "assets", "topik2-3900-vocab.json")
BACKUP_FILE = os.path.join(BASE, "src", "assets", "topik-vocab-old.json")

def main():
    # Load files
    with open(OLD_FILE, encoding='utf-8') as f:
        old_entries = json.load(f)
    with open(NEW_FILE, encoding='utf-8') as f:
        new_entries = json.load(f)

    print(f"Old vocab: {len(old_entries)} entries")
    print(f"New vocab: {len(new_entries)} entries")

    # Build lookup maps
    old_by_word = {e['word']: e for e in old_entries}
    new_by_word = {e['word']: e for e in new_entries}

    # Separate old entries by level
    level1 = [e for e in old_entries if e['level'] == 1]
    level2_old = [e for e in old_entries if e['level'] == 2]
    level3 = [e for e in old_entries if e['level'] == 3]

    old_l2_words = {e['word'] for e in level2_old}
    new_words = set(new_by_word.keys())

    print(f"\nLevel 1: {len(level1)}")
    print(f"Level 2 (old): {len(level2_old)}")
    print(f"Level 3: {len(level3)}")
    print(f"New TOPIK II words: {len(new_entries)}")
    print(f"Overlap L2 ∩ new: {len(old_l2_words & new_words)}")
    print(f"Only in new: {len(new_words - old_l2_words)}")
    print(f"Only in old L2: {len(old_l2_words - new_words)}")

    # Build merged level-2 entries
    merged_level2 = []
    stats = {'updated': 0, 'added': 0, 'kept_old': 0}

    # First, add all entries from new file (preferred source for L2)
    for entry in new_entries:
        word = entry['word']
        new_en = entry['translations']['en']

        if word in old_by_word:
            old_entry = old_by_word[word]
            # Merge: use new English (cleaner), keep old zh/ja if present
            merged = {
                'word': word,
                'level': 2,
                'pos': entry.get('pos') or old_entry.get('pos'),
                'translations': {
                    'en': new_en,
                    'zh': old_entry['translations'].get('zh', ''),
                    'ja': old_entry['translations'].get('ja', ''),
                }
            }
            stats['updated'] += 1
        else:
            # New word - add with empty zh/ja
            merged = {
                'word': word,
                'level': 2,
                'pos': entry.get('pos'),
                'translations': {
                    'en': new_en,
                    'zh': '',
                    'ja': '',
                }
            }
            stats['added'] += 1
        merged_level2.append(merged)

    # Also keep old L2 words not in new file (they were in existing TOPIK II list)
    for entry in level2_old:
        if entry['word'] not in new_words:
            merged_level2.append(entry)
            stats['kept_old'] += 1

    # Sort merged_level2 alphabetically by word
    merged_level2.sort(key=lambda e: e['word'])

    print(f"\nMerge stats:")
    print(f"  Updated (in both): {stats['updated']}")
    print(f"  Added (new only):  {stats['added']}")
    print(f"  Kept (old only):   {stats['kept_old']}")
    print(f"  Total level 2:     {len(merged_level2)}")

    # Assemble final list: L1 (sorted) + L2 (sorted) + L3 (sorted)
    level1_sorted = sorted(level1, key=lambda e: e['word'])
    level3_sorted = sorted(level3, key=lambda e: e['word'])

    final = level1_sorted + merged_level2 + level3_sorted

    print(f"\nFinal total: {len(final)} entries")
    print(f"  Level 1: {len(level1_sorted)}")
    print(f"  Level 2: {len(merged_level2)}")
    print(f"  Level 3: {len(level3_sorted)}")

    # Backup old file
    shutil.copy2(OLD_FILE, BACKUP_FILE)
    print(f"\nBacked up old file to: {BACKUP_FILE}")

    # Write merged result
    with open(OLD_FILE, 'w', encoding='utf-8') as f:
        json.dump(final, f, ensure_ascii=False, indent=2)

    print(f"Written to: {OLD_FILE}")

    # Verify
    with open(OLD_FILE, encoding='utf-8') as f:
        verify = json.load(f)
    print(f"\nVerification - loaded {len(verify)} entries OK")

    # Check for any entries missing translations
    missing = [e for e in verify if not e['translations'].get('en')]
    print(f"Entries with empty English translation: {len(missing)}")
    if missing[:5]:
        for e in missing[:5]:
            print(f"  {e['word']}: {e['translations']}")

if __name__ == '__main__':
    main()
