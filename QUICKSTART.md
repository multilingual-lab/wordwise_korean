# 🚀 Quick Start Guide

Get WordWise Korean running in **5 minutes**!

## Prerequisites

- Node.js 18+ installed
- pnpm, npm, or yarn
- Chrome or Edge browser

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd wordwise_korean
pnpm install
```

**Wait for installation to complete** (~1-2 minutes)

### 2. Start Development Server

```bash
pnpm dev
```

This will:
- ✅ Build the extension
- ✅ Open Chrome automatically
- ✅ Load the extension
- ✅ Watch for changes

**Look for**: "Ready" message in terminal

### 3. Test the Extension

#### Option A: Use Test Page (Recommended for first time)

1. Open `test.html` in the browser that was opened by WXT
2. You should see translations appear above Korean words
3. Try clicking "Add Korean Text" button to test dynamic content

#### Option B: Visit Real Korean Websites

Try these sites:
- https://ko.wikipedia.org/wiki/한국어
- https://news.naver.com
- https://twitter.com (search for 한국어)

### 4. Configure Settings

1. Click the extension icon (puzzle piece) in browser toolbar
2. A popup will open with settings:
   - **Toggle**: Turn on/off
   - **Level**: Choose TOPIK I (~1,600 words), TOPIK Ⅱ (~2,700 words), or All (~4,300 words)
   - **Language**: English, Chinese, or Japanese
   - **Highlight**: Show background highlight
3. Changes apply immediately!

## Troubleshooting

### Extension not showing up?

1. Go to `chrome://extensions`
2. Look for "WordWise Korean"
3. Make sure it's enabled (toggle switch on)
4. Click "Reload" if needed

### No translations appearing?

1. Open the popup and ensure extension is **Enabled**
2. Check if page has Korean text (가-힣 characters)
3. Try refreshing the page
4. Check browser console (F12) for errors

### Build errors?

```bash
# Clear cache and rebuild
rm -rf .wxt .output node_modules
pnpm install
pnpm dev
```

### Port already in use?

Kill the process using port 3000:

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

## Development Workflow

### Making Changes

1. **Edit TypeScript files** in `src/`
2. **Changes auto-reload** - watch the terminal
3. **Extension reloads** in browser automatically
4. **Test immediately** on your test page

### Common Files to Edit

- `src/assets/topik-vocab.json` - View 4,341 words vocabulary database
- `src/entrypoints/content.ts` - Modify annotation logic
- `src/entrypoints/popup/App.vue` - Change UI
- `src/utils/annotator.ts` - Tweak matching algorithm
- `src/utils/korean-stem.ts` - Adjust conjugation handling

### Vocabulary Management

See [scripts/README.md](scripts/README.md) for tools to:
- Parse PDF vocabulary lists
- Convert CSV files to vocabulary JSON
- Batch translate using AI

Source vocabulary files are in `data/` folder.

### Testing Changes

After each change:
1. ✅ Terminal shows "Build complete"
2. ✅ Extension auto-reloads
3. ✅ Refresh test page
4. ✅ Verify changes work

## Building for Production

When ready to distribute:

```bash
# Build optimized version
pnpm build

# Package as ZIP
pnpm zip
```

Output: `.output/chrome-mv3.zip`

## Next Steps

1. ✅ **Expand Vocabulary**: Add more words to `topik-vocab.json`
2. ✅ **Customize Styling**: Edit CSS in `content.ts`
3. ✅ **Add Features**: Implement statistics, custom vocab, etc.
4. ✅ **Test Thoroughly**: Try different websites and scenarios
5. ✅ **Share**: Publish to Chrome Web Store!

## Getting Help

- **Documentation**: See `README.md` for full details
- **Issues**: Check browser console (F12) for errors
- **Code**: Well-commented - read through files to understand

## Success Checklist

- [ ] Extension appears in browser toolbar
- [ ] Popup opens and shows settings
- [ ] Test page shows translations above Korean words
- [ ] Can change settings and see updates
- [ ] Dynamic content button works (adds annotated text)
- [ ] Works on real Korean websites

**All checked?** 🎉 **You're ready to start learning Korean with WordWise!**

---

**Happy Learning! 화이팅! 💪**
