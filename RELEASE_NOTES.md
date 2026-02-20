# WordWise Korean v0.1.2

**Smarter annotations, cleaner translations!** Browser extension for Korean vocabulary learning with complete TOPIK I + II coverage.

## ✨ What's New in v0.1.2

### Fixed: Noun/Verb Annotation Collisions
Korean words that double as nouns and verb stems are now correctly resolved using a POS-aware lookup engine:

| Before | After |
|--------|-------|
| `살았어요` → `살` "flesh" ❌ | `살았어요` → `살다` "live" ✅ |
| `배우니까` → `배우` "actor" ❌ | `배우니까` → `배우다` "learn" ✅ |
| `서고`/`서는` → `서` "west" ❌ | `서고`/`서는` → `서다` "stand" ✅ |
| `해요`/`했어요` → (nothing) ❌ | `해요`/`했어요` → `하다` "do" ✅ |

### Fixed: Digit-Compound Annotation
Numbers like `1심`, `2층`, `3복` no longer trigger spurious annotations on the Korean component.

### Cleaner Translation Display
Translations are now post-processed for concise display:
- **Parenthetical notes removed**: `"(a local district) gun"` → `"gun"`
- **Tilde meta-descriptions removed**: `"one, one of the ~"` → `"one"`, `"~ person(s), ~ minute(s)"` → `"person, minute"`
- **Near-synonyms deduplicated**: `"autumn, fall"` → `"autumn"`, `"want, wish, desire"` → `"want"`, `"strange, funny, weird"` → `"strange"`

### New Extension Icon
Redesigned icon — clean bold W on a purple gradient, replacing the original book/한 design.

### Expanded Vocabulary
- **6,065 words** total (up from 4,341)
- TOPIK I: 1,578 words | TOPIK II: 4,487 words

## ✨ Core Features

- **6,065 TOPIK I & II vocabulary words** — complete beginner to intermediate coverage
- **POS-aware conjugation matching** — correctly resolves noun/verb ambiguity
- **Clean translation display** — concise, no noise
- **Grammar particle filtering** — excludes common particles (은/는/이/가/을/를/etc.)
- **Three vocabulary levels** — TOPIK I, TOPIK Ⅱ, or All
- **English translations** — high-quality (Chinese & Japanese coming soon!)
- **Dynamic content support** — works on modern websites, SPAs, infinite scroll
- **Optional highlighting** — visual emphasis for annotated words
- **Privacy-focused** — all processing happens locally, no data collection

## 📥 Installation

1. **Download** `wordwise-korean-0.1.2-chrome.zip` below
2. **Extract** the ZIP file to a folder
3. **Open Chrome** and go to `chrome://extensions/`
4. **Enable** "Developer mode" (toggle in top right)
5. **Click** "Load unpacked" and select the extracted folder
6. **Done!** Click the extension icon to configure

## 🎯 Usage

1. Click the extension icon in your toolbar
2. Enable the toggle
3. Select your TOPIK level (I, Ⅱ, or All)
4. Visit any Korean website!

**Test it on**:
- [Korean Wikipedia](https://ko.wikipedia.org/wiki/한국어)
- [Naver News](https://news.naver.com)

## 🐛 Known Limitations

- `가서` (가다 + ㅏ-contraction) produces no annotation — Unicode syllable-block contraction not yet handled
- Currently only English translations available (Chinese & Japanese coming soon!)
- Chrome may disable developer mode extensions after browser restart (simply re-enable)

## 🔮 Coming Soon

- Chinese and Japanese translation support
- User custom vocabulary feature
- Learning statistics dashboard
- Audio pronunciation support
- Export/import word lists

## 📄 Documentation

- **README**: [Project overview and developer guide](https://github.com/leahyums/wordwise_korean#readme)
- **CHANGELOG**: [Version history](https://github.com/leahyums/wordwise_korean/blob/main/CHANGELOG.md)
- **Vocabulary Guide**: [Adding custom words](https://github.com/leahyums/wordwise_korean/blob/main/data/README.md)

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING guidelines](https://github.com/leahyums/wordwise_korean#contributing) in the main README.

## 📜 License

MIT License — Free and open source

---

**Questions or issues?** [Open an issue](https://github.com/leahyums/wordwise_korean/issues)

**Happy learning! 화이팅! 💪**

### Added Features
- **🎚️ Font Size Control** - New slider in popup to adjust translation text size
  - Range: 80% to 150% in 5% increments
  - Real-time updates without page reload
  - Perfect for emails, small text, or accessibility needs
  
### Improvements
- **⬆️ Larger Default Size** - Increased from 0.5em to 0.6em (20% bigger!)
  - Much more readable in emails and small text areas
  - Better visibility on high-resolution displays
  
- **🌐 Simplified Language Options** - Hidden Chinese/Japanese (coming soon!)
  - Only English available for now (other translations in progress)
  - Reduced confusion about unavailable features

## ✨ Core Features

- **4,341 TOPIK I & II vocabulary words** - Complete beginner to intermediate coverage
- **Smart conjugation matching** - Handles verb and adjective variations automatically
- **Grammar particle filtering** - Excludes common particles (은/는/이/가/을/를/etc.) for cleaner text
- **Three vocabulary levels** - Choose TOPIK I, TOPIK Ⅱ, or All
- **Multiple vocabulary sources** - Over 4,341 words from TOPIK I & II
- **English translations** - High-quality English translations (Chinese & Japanese coming soon!)
- **Dynamic content support** - Works on modern websites, SPAs, infinite scroll
- **Optional highlighting** - Visual emphasis for annotated words
- **Privacy-focused** - All processing happens locally, no data collection

## 📥 Installation

1. **Download** `wordwise-korean-0.1.1-chrome.zip` below
2. **Extract** the ZIP file to a folder
3. **Open Chrome** and go to `chrome://extensions/`
4. **Enable** "Developer mode" (toggle in top right)
5. **Click** "Load unpacked" and select the extracted folder
6. **Done!** Click the extension icon to configure

> 📖 Detailed instructions: [INSTALL.md](https://github.com/leahyums/wordwise_korean/blob/main/INSTALL.md)

## 🎯 Usage

1. Click the extension icon in your toolbar
2. Enable the toggle
3. Select your TOPIK level (I, Ⅱ, or All)
4. Visit any Korean website!

**Test it on**: 
- [Korean Wikipedia](https://ko.wikipedia.org/wiki/한국어)
- [Naver News](https://news.naver.com)
- [Korean Twitter](https://twitter.com/search?q=한국어)

## 🎉 What's New in v0.1.0

### Initial Release Features

- **Complete TOPIK I + II Coverage** - 4,341 vocabulary words from official materials
- **Smart Conjugation Matching** - Automatically handles Korean verb/adjective variations
- **Grammar Particle Filtering** - Excludes common particles (은/는/이/가/을/를) for cleaner reading
- **Three Vocabulary Levels** - Choose TOPIK I only, TOPIK Ⅱ only, or all levels combined
- **Dynamic Content Support** - Works on modern websites, SPAs, and pages with infinite scroll
- **Ruby Tag Annotations** - Translations appear directly above words (always visible, no hover needed)
- **Privacy-Focused** - All processing happens locally, no data collection or tracking

### Technical Highlights

- Built with modern WXT framework
- Vue 3 + TypeScript for popup UI
- Chrome Manifest V3 compliant
- Comprehensive documentation and tooling
- Vocabulary management scripts included

## 📊 Vocabulary Coverage

| Level | Words | Coverage |
|-------|-------|----------|
| TOPIK I | 1,578 | All elementary words |
| TOPIK Ⅱ | 2,729 | All intermediate/advanced words |
| **Total** | **4,341** | Complete beginner to intermediate |

## 🛠️ Tech Stack

- WXT Framework - Modern extension development
- Vue 3 + TypeScript
- Chrome Manifest V3
- Ruby tags for semantic annotations

## 📄 Documentation

- **README**: [Project overview and developer guide](https://github.com/leahyums/wordwise_korean#readme)
- **INSTALL**: [User installation instructions](https://github.com/leahyums/wordwise_korean/blob/main/INSTALL.md)
- **CHANGELOG**: [Version history](https://github.com/leahyums/wordwise_korean/blob/main/CHANGELOG.md)
- **Vocabulary Guide**: [Adding custom words](https://github.com/leahyums/wordwise_korean/blob/main/data/README.md)

## 🐛 Known Limitations

This is a beta release for community testing before Chrome Web Store publication:

- Currently only English translations available (Chinese & Japanese coming soon!)
- Chrome may disable developer mode extensions after browser restart (normal behavior - simply re-enable)
- Some dynamic websites may require a page refresh after changing settings
- Not yet available on Chrome Web Store (manual installation required)

## 🔮 Coming Soon

- Chrome Web Store publication
- Chinese and Japanese translation support
- User custom vocabulary feature
- Learning statistics dashboard
- Audio pronunciation support
- Export/import word lists

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING guidelines](https://github.com/leahyums/wordwise_korean#contributing) in the main README.

## 📜 License

MIT License - Free and open source

---

**Questions or issues?** [Open an issue](https://github.com/leahyums/wordwise_korean/issues)

**Happy learning! 화이팅! 💪**
