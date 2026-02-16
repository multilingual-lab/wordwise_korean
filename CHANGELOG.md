# Changelog

All notable changes to WordWise Korean will be documented in this file.

## [v2.2.5] - 2026-02-16

### Fixed
- **Grammar Particle Filtering**: Common Korean particles (은/는/이/가/을/를/의/도/와/과/etc.) are now excluded from annotation to reduce clutter
  - Added `COMMON_PARTICLES` Set with 20 common functional words
  - These particles were incorrectly being translated (e.g., "은" as "silver" instead of topic marker)

### Changed
- Updated vocabulary loader to filter out grammar particles before processing

## [v2.2.4] - 2026-02-16

### Fixed
- **Level Switching Bug**: Changing vocabulary level in popup now properly reloads vocabulary
  - Fixed timing issue where `config` was updated before comparison in `setTimeout`
  - Changed to use `oldConfig` for comparisons (captured at start of listener)
  - Now correctly loads different vocabulary counts: TOPIK I (1,578), TOPIK Ⅱ (2,729), All (4,341)

## [v2.2.3] - 2026-02-16

### Added
- **Enhanced Console Logging**: Detailed logs for debugging level changes
  - Shows old level → new level transitions
  - Displays vocabulary words loaded count for each level
  - Shows annotations added/cleared counts
  - Logs highlight and language setting changes

### Changed
- Improved version banner in console to show current features

## [v2.2.2] - 2026-02-16

### Fixed
- Config update timing: Now updates annotator config AFTER vocabulary is loaded
- Fixed timing bug where config was updated before vocabulary loaded, causing wrong level to be used

### Changed
- Reordered operations in storage change listener for proper sequencing

## [v2.2.1] - 2026-02-16

### Added
- Highlight toggle support in settings change detection

### Fixed
- Highlight toggle now properly triggers re-annotation when changed

## [v2.2.0] - 2026-02-16

### Changed
- Improved annotation clearing strategy: Direct ruby tag replacement
- Extract only text nodes from ruby elements, skip `<rt>` tags
- Better handling of annotation containers during cleanup

### Fixed
- Duplicate annotations when switching levels (attempted fix)

## [v2.1.0] - 2026-02-16

### Added
- Enhanced duplicate annotation prevention when clearing

### Changed
- Modified `clearAnnotations()` to walk child nodes and skip `<rt>` tags
- Reduced verbose console logging (removed "Found X words" spam)

## [v2.0.0] - 2026-02-16

### Added
- **Vocabulary Expansion**: Imported 4,341 TOPIK I + II words from official materials
  - TOPIK I: 1,578 words (99.4% import success)
  - TOPIK Ⅱ: 2,729 words (102.5% due to duplicates in source)
- **Three-Level System**: 
  - Level 1: TOPIK I only
  - Level 2: TOPIK Ⅱ only
  - Level 3: All levels combined
- **Korean Verb/Adjective Conjugation Matching**:
  - Stem extraction algorithm with 30+ ending patterns
  - Handles 다-form, 요-form, 어/아-form, ㄴ/은-form, etc.
  - Falls back to exact match if stem matching fails
- **Vocabulary Management Scripts**:
  - `pdf-to-vocab.js`: Parse PDF text to JSON with line-by-line parsing
  - `csv-to-vocab.js`: Convert CSV files to vocab JSON
  - `batch-translate.js`: AI-powered translation for missing languages
- **Project Organization**:
  - Created `data/` folder for source materials
  - Created `scripts/` folder with comprehensive README
  - Updated all documentation

### Changed
- Popup UI updated to show "TOPIK I", "TOPIK Ⅱ", "All" instead of numbers
- Popup shows level in Roman numerals (I, Ⅱ) for consistency
- Updated content script to handle larger vocabulary (~1MB bundled size)

### Fixed
- Public directory warning (moved to src/public)
- Content script registration (switched to manifest mode)
- Various build warnings and errors

## [v1.0.0] - 2026-02-15

### Added
- Initial release with core functionality
- Content script that annotates Korean words with translations
- Popup UI for settings (enable/disable, level, language, highlight)
- Ruby tag-based annotations (translations appear above words)
- MutationObserver for dynamic content support
- Chrome storage sync for settings persistence
- Three vocabulary levels (initially with ~33 words)
- Three translation languages (English, Chinese, Japanese)
- Optional highlight styling for annotated words
- WXT framework integration with hot reload
- TypeScript support throughout
- Vue 3 for popup interface

### Technical Features
- WeakSet-based processed node tracking
- Debounced DOM observation (500ms)
- Skip tags for non-content elements
- Position-based overlap detection
- Longest-word-first matching algorithm
- Clean ruby tag styling with proper line height

---

## Version Numbering

- **Major** (X.0.0): Breaking changes, major feature additions
- **Minor** (0.X.0): New features, non-breaking changes
- **Patch** (0.0.X): Bug fixes, minor improvements
