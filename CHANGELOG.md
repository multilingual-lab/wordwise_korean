# Changelog

All notable changes to WordWise Korean will be documented in this file.

## [0.1.3] - 2026-02-21

### Added
- **Multilingual popup**: Language selector now a dropdown with all three options — English, 中文, 日本語
- **Landing page demo language switcher**: EN / 中文 / 日本語 tabs switch live annotation previews in the demo iframe
- **Vocab count automation**: `pnpm update-counts` script derives all word counts from JSON and patches `docs/index.html`; no more hardcoded numbers scattered across files

### Changed
- **Icon refresh**: Deeper purple gradient (#7c3aed → #a78bfa) with slightly larger corner radius for a softer look
- **Vocabulary quality**:
  - `열대야` EN fixed: "a very hot night" → "tropical night"
  - `우리말` removed (culturally nuanced; not useful as a standalone annotation)

### Developer
- `pnpm update-counts` — syncs `docs/index.html` word counts from `topik-vocab.json`
- `pnpm generate-icons` — rebuilds PNG icons from `icon.svg`

## [0.1.2] - 2026-02-20

### Added
- **New Extension Icon**: Redesigned icon — clean bold W on a purple gradient, replacing the original book/한 design
- **Expanded Vocabulary**: 4,341 → **6,065 words**
  - TOPIK I: 1,578 words (unchanged)
  - TOPIK II: 2,729 → **4,487 words** (+1,725 new words, duplicates removed)
- **Cleaner Translations**: English translations are now trimmed for display — parenthetical notes, unit markers (`~ piece(s)`, `~ minute(s)`), and near-synonyms (`autumn, fall` → `autumn`) are removed automatically

### Fixed
- **Wrong annotations on verb forms**: Words like `살았어요`, `배우니까`, `서고`, `서는`, `해요` now correctly resolve to their verb (`살다`, `배우다`, `서다`, `하다`) instead of a same-spelled noun
- **Numbers before Korean no longer annotated**: `1심`, `2층`, `3복` etc. are skipped
- **Extension crash on first level switch**: No longer crashes when switching level immediately after a fresh install
- **Translation cleanup**: Removed verbose `to`/`to be`/`being` prefixes and resolved ~1,500 conflicting entries from the vocabulary expansion

### Known Issues
- `가서` (가다 + ㅏ-contraction) produces no annotation

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
