# WordWise Korean 📚

A browser extension that adds Kindle Word Wise style annotations for Korean language learning. Translations appear directly above vocabulary words - always visible, no hover needed!

## ✨ Features

- **Instant Translations**: Korean vocabulary words are automatically annotated with translations above them
- **TOPIK Levels**: Filter vocabulary by TOPIK I, TOPIK Ⅱ, or all levels (4,341 words)
- **Multiple Languages**: Choose translations in English, Chinese, or Japanese
- **Smart Matching**: Handles verb/adjective conjugations with stem extraction
- **Grammar Particle Filtering**: Excludes common particles (은/는/이/가/을/를/etc.) to avoid cluttering text
- **Dynamic Content**: Works on single-page applications with real-time updates
- **Visual Highlight**: Optional background highlight for annotated words
- **Privacy First**: All processing happens locally - no data sent to servers

## 🎯 How It Works

When you visit a Korean website, the extension:

1. Scans the page for Korean text
2. Matches words against your vocabulary level
3. Adds ruby tags with translations above words
4. Watches for new content and annotates it automatically

Example:
```
Hello      friend        library
안녕하세요! 친구와 함께 도서관에 갔어요.
```

## 🚀 Installation

### For Development

1. **Install dependencies**:
```bash
pnpm install
# or npm install / yarn install
```

2. **Start development mode**:
```bash
pnpm dev
```

This will:
- Build the extension
- Open Chrome with the extension loaded
- Watch for changes and auto-reload

3. **Visit a Korean website** to test:
- https://ko.wikipedia.org
- https://news.naver.com
- https://twitter.com (search for Korean content)

### Building for Production

```bash
# Build for Chrome/Edge
pnpm build

# Build for Firefox
pnpm build:firefox

# Create distribution ZIP
pnpm zip
```

Output will be in `.output/` directory.

## 📖 Usage

1. Click the extension icon in your browser toolbar
2. Enable the extension using the toggle
3. Select your vocabulary level:
   - **TOPIK I**: Basic vocabulary (1,578 words)
   - **TOPIK Ⅱ**: Intermediate/Advanced (2,729 words)
   - **All**: Complete vocabulary (4,341 words)
4. Choose your preferred translation language
5. Visit any Korean website and see translations appear!

## 🏗️ Project Structure

```
wordwise_korean/
├── src/
│   ├── entrypoints/
│   │   ├── content.ts           # Main annotation logic
│   │   ├── background.ts        # Background script
│   │   └── popup/              # Settings UI
│   ├── utils/
│   │   ├── annotator.ts        # Core annotation engine
│   │   ├── vocabulary-loader.ts # Vocab filtering
│   │   ├── korean-stem.ts      # Conjugation matching
│   │   └── dom-observer.ts     # Dynamic content watcher
│   ├── assets/
│   │   └── topik-vocab.json    # 4,341 words from TOPIK I + II
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── scripts/
│   ├── pdf-to-vocab.js         # Parse PDF text to JSON
│   ├── csv-to-vocab.js         # Convert CSV to vocab JSON
│   ├── batch-translate.js      # AI translation tool
│   └── README.md               # Scripts documentation
├── data/
│   ├── topik-1671-words.txt    # TOPIK I source text
│   └── topik-2662-words.txt    # TOPIK II source text
├── docs/
│   └── VOCABULARY-EXPANSION.md # Vocabulary guide
├── public/                     # Static assets
├── wxt.config.ts              # WXT configuration
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: [WXT](https://wxt.dev/) - Modern extension development
- **UI**: Vue 3 + TypeScript
- **Styling**: Native CSS with ruby tag support
- **Build**: Vite
- **Manifest**: V3 (Chrome/Edge/Firefox compatible)

## 🎨 Customization

### Adding Vocabulary

Edit `src/assets/topik-vocab.json` or use our vocabulary management scripts:

```bash
# Convert CSV to JSON
node scripts/csv-to-vocab.js mywords.csv --merge

# Parse PDF text
node scripts/pdf-to-vocab.js extracted-text.txt --level 1 --merge

# Auto-translate missing languages
node scripts/batch-translate.js src/assets/topik-vocab.json
```

See [scripts/README.md](scripts/README.md) for detailed documentation.

### Styling Annotations

Edit the CSS in `src/entrypoints/content.ts`:

```css
ruby.word-wise-korean rt {
  font-size: 0.55em;      /* Adjust translation size */
  color: #667eea;         /* Change color */
  font-weight: 600;       /* Adjust weight */
}
```

## 🐛 Troubleshooting

### Extension not working?

1. Check if extension is enabled in popup
2. Refresh the page after changing settings
3. Check browser console for errors (F12 → Console)

### Annotations not appearing?

- Make sure the page contains Korean text (Hangul characters)
- Verify vocabulary level includes the words
- Check if the site is using unsupported elements (SVG, Canvas)

### Performance issues?

- Reduce vocabulary level to decrease processing
- The extension uses debouncing (500ms) for dynamic content
- Some sites with heavy dynamic updates may experience slight delays

## 📝 Development Tips

### Hot Reload
WXT provides instant hot reload - just save your changes and see them immediately!

### Testing
Test on these Korean websites:
- https://ko.wikipedia.org/wiki/한국어
- https://news.naver.com
- https://twitter.com/search?q=한국어

### Debugging
- Open extension popup and check console: Right-click → Inspect
- Content script logs: Open page console (F12)
- Background script: `chrome://extensions` → Details → Inspect views

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding Vocabulary
Priority areas:
- Expand TOPIK 1-2 vocabulary (currently 20 words)
- Add TOPIK 3-6 levels
- Improve translations accuracy
- Add part-of-speech information

## 📄 License

MIT License - feel free to use this project for learning and development!

## 🙏 Acknowledgments

- Inspired by [Furigana Maker](https://github.com/aiktb/furiganamaker) for Japanese learning
- Built with [WXT](https://wxt.dev/) - amazing extension framework
- Korean vocabulary based on TOPIK standards

## 🎯 Roadmap

- [x] Expand vocabulary to TOPIK I + II (4,341 words)
- [x] Handle Korean verb/adjective conjugations
- [x] Filter common grammar particles
- [ ] Add user custom vocabulary
- [ ] Statistics dashboard (words learned, pages visited)
- [ ] Export/import vocabulary lists
- [ ] Improve Chinese/Japanese translations accuracy
- [ ] Pronunciation audio support
- [ ] Spaced repetition learning features

---

Made with ❤️ for Korean language learners

**Start learning Korean vocabulary while browsing the web! 화이팅! 💪**
