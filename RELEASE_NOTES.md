# WordWise Korean — Release Notes

## [v0.1.2] — 2026-02-20

### Fixed
- **Noun/verb annotation collisions**: Words that double as nouns and verb stems are now correctly resolved using a POS-aware lookup engine:

  | Before | After |
  |--------|-------|
  | `살았어요` → `살` "flesh" ❌ | `살았어요` → `살다` "live" ✅ |
  | `배우니까` → `배우` "actor" ❌ | `배우니까` → `배우다` "learn" ✅ |
  | `서고`/`서는` → `서` "west" ❌ | `서고`/`서는` → `서다` "stand" ✅ |
  | `해요`/`했어요` → (nothing) ❌ | `해요`/`했어요` → `하다` "do" ✅ |

- **Digit-compound annotation**: Numbers like `1심`, `2층`, `3복` no longer trigger spurious annotations on the Korean component.

### Added
- **New extension icon**: Clean bold W on a purple gradient.
- **Expanded vocabulary**: 4,341 → 6,065 words (TOPIK I: 1,578 | TOPIK II: 4,487)
- **Cleaner translation display**:
  - Parenthetical notes removed: `"(a local district) gun"` → `"gun"`
  - Tilde meta-descriptions removed: `"~ person(s), ~ minute(s)"` → `"person, minute"`
  - Near-synonyms deduplicated: `"autumn, fall"` → `"autumn"`, `"want, wish, desire"` → `"want"`

### Known Issues
- `가서` (가다 + ㅏ-contraction) produces no annotation

---

## [v0.1.1] — 2026-02-16

### Added
- **Font size control**: New slider in popup to adjust translation text size (80%–150%), with real-time updates and saved preference.

### Changed
- **Larger default annotation size**: Increased from 0.5em to 0.6em (20% larger).
- **Simplified language options**: Chinese/Japanese options hidden; only English available currently.

---

## Installation

1. Download the `.zip` file below
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Drag and drop the `.zip` directly onto the page
5. Click the extension icon to configure

---

## [v0.1.0] — 2026-02-16

Initial release.

### Added
- 4,341 TOPIK I + II vocabulary words (TOPIK I: 1,578 | TOPIK II: 2,729)
- Smart conjugation matching for verb and adjective forms
- Grammar particle filtering (은/는/이/가/을/를/etc.)
- Three vocabulary levels: TOPIK I, TOPIK II, or All
- Ruby tag annotations above words (always visible, no hover needed)
- Dynamic content support (SPAs, infinite scroll)
- Privacy-focused: all processing local, no data collection
