# Changelog

All notable changes to WordWise Korean will be documented in this file.

## [0.1.2] - 2026-02-20

### Added
- **Expanded Vocabulary**: 4,341 → **6,065 words** (net after dedup)
  - Merged TOPIK II word list from `topik2-3900-vocab.json` (+1,725 new words)
  - TOPIK I: 1,578 words (unchanged)
  - TOPIK II: 2,729 → **4,487 words**
- **Test Suite (Vitest)**: 78 automated tests across 2 files
  - `src/tests/vocab-translations.test.ts` — translation precision, polysemous word protection, verbose prefix removal, new word coverage
  - `src/tests/stem-matching.test.ts` — conjugation resolution, connector forms, `extractStems` output shape, known limitations
  - Run with `pnpm test`

### Fixed
- **277 Duplicate Entries Removed**: Same word appearing at both TOPIK I and TOPIK II levels — lower level (TOPIK I) kept
- **260 Verbose Verb Prefixes Stripped**: Translations that started with `to `, `to be `, or `being ` were cleaned
  - e.g. `가다` "to go" → "go", `길다` "to be long" → "long", `객관적` "being objective" → "objective"
- **1,283 Translation Conflicts Resolved** via smart merge strategy:
  - Strip verbose prefix from old translation, then pick shorter/more concise
  - Protect polysemous words (both under 10 chars, no word overlap) — e.g. `감` = "persimmon" kept over "sense of", `가사` = "housework" kept over "lyrics"
  - Result: 673 updated to new (more concise), 610 kept old (already precise)

### Known Issues (Documented by Tests)
- `가서` (가다 + ㅏ-contraction) produces no annotation — ㅏ-ending contraction not handled by stem extractor
- `해요`/`했어요` (하다 irregular contraction) produces no annotation
- `살았어요` → annotates as `살` ("flesh") instead of `살다` ("live") — bare stem hits before verb form
- `배우니까` → annotates as `배우` ("actor") instead of `배우다` ("learn") — noun shadows verb stem
- These are tracked for fixing in the next iteration; see `DEVELOPMENT.md` for details

## [0.1.1] - 2026-02-16

### Added
- **Font Size Control**: New slider in popup to adjust translation text size (80%-150%)
  - Real-time updates without page reload
  - Optimized to only update CSS, no re-annotation needed
  - Preference saved across all websites
- **Better Readability**: Increased default annotation font size from 0.5em to 0.6em (20% larger)
  - Much more readable in emails and pages with small text
  - Better visibility on high-resolution screens

### Changed
- **Simplified Language Options**: Hidden Chinese and Japanese options in popup
  - Only English available currently (others are placeholders)
  - Added note: "Chinese & Japanese translations coming soon!"
  - Reduces user confusion about unavailable features

### Technical
- Dynamic font size injection based on user preference
- Optimized setting changes to avoid unnecessary re-annotation

## [0.1.0] - 2026-02-16

### Initial Release

A browser extension that adds Kindle Word Wise style annotations for Korean language learning.

### Features

- **Complete TOPIK I + II Vocabulary**: 4,341 words imported from official TOPIK materials
  - TOPIK I: 1,578 words (beginner level)
  - TOPIK Ⅱ: 2,729 words (intermediate/advanced level)
- **Smart Conjugation Matching**: Handles Korean verb and adjective conjugations
  - Stem extraction algorithm with 30+ ending patterns
  - Supports 다-form, 요-form, 어/아-form, ㄴ/은-form, and more
- **Grammar Particle Filtering**: Excludes 20+ common particles (은/는/이/가/을/를/의/도/etc.)
  - Prevents cluttering text with functional words
  - Focuses on vocabulary learning
- **Three Vocabulary Levels**: 
  - TOPIK I only
  - TOPIK Ⅱ only  
  - All levels combined
- **Multiple Translation Languages**: English, Chinese (placeholder), Japanese (placeholder)
- **Ruby Tag Annotations**: Translations appear directly above Korean words
  - Always visible, no hover needed
  - Semantic HTML5 elements
- **Dynamic Content Support**: Works on modern websites
  - MutationObserver for SPA support
  - Debounced processing (500ms)
  - Infinite scroll compatible
- **Optional Highlighting**: Visual background for annotated words
- **Privacy-Focused**: All processing happens locally
  - No data collection
  - No external API calls
  - Settings stored in Chrome sync

### Technical Features

- Built with WXT framework for modern extension development
- Vue 3 + TypeScript for popup UI
- Chrome Manifest V3 compliant
- WeakSet-based processed node tracking
- Position-based overlap detection
- Longest-word-first matching algorithm

### Documentation

- Comprehensive README with setup and usage instructions
- Installation guide (INSTALL.md) for end users
- Developer documentation (DEVELOPMENT.md)
- Vocabulary customization guide (data/README.md)
- Script documentation for vocabulary management

### Vocabulary Management Scripts

- **pdf-to-vocab.js**: Parse PDF text to JSON with line-by-line parsing
- **csv-to-vocab.js**: Convert CSV files to vocabulary JSON
- **batch-translate.js**: AI-powered translation for missing languages

### Known Issues

- Chinese and Japanese translations are currently placeholders (English-based)
- Chrome may disable developer mode extensions on restart (expected behavior)
- Some dynamic sites may require page refresh after changing settings

---

## Version Numbering

- **Major** (X.0.0): Breaking changes, major feature additions
- **Minor** (0.X.0): New features, non-breaking changes
- **Patch** (0.0.X): Bug fixes, minor improvements
