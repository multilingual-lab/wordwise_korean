# WordWise Korean - Vibe Coding Kickstart Plan 🚀

> A browser extension that adds Kindle Word Wise style annotations for Korean learning - translations appear directly above vocabulary words, no hover needed!

## 🎯 Project Vision

**What we're building**: Like Kindle Word Wise + Furigana Maker, but for Korean language learning.

**Status**: ✅ **COMPLETED - Fully functional with 4,341 TOPIK I/II vocabulary words!**

**Latest Version**: v2.2.5 (Grammar particle filtering, level switching fix, enhanced logging)

**Core UX**: 
```
Hello         friend     library
안녕하세요! 저는 친구와 함께 도서관에 갔어요.
```

Translations appear **directly above** Korean words - always visible, no interaction needed.

---

## 📦 Tech Stack

```json
{
  "framework": "WXT (Modern extension framework)",
  "ui": "Vue 3 + TypeScript",
  "styling": "CSS (native ruby tags)",
  "vocabulary": "Built-in TOPIK 1-2 JSON",
  "tokenization": "Regex matching (MVP), API later"
}
```

**Why WXT?**
- Hot reload for extensions
- TypeScript support out of the box
- Manifest V3 ready
- Vue/React support
- Simple API

---

## 🏗️ Project Structure

```
wordwise_korean/
├── src/
│   ├── entrypoints/
│   │   ├── content.ts              # Main logic - annotates pages
│   │   ├── background.ts           # Service worker (future API calls)
│   │   └── popup/
│   │       ├── App.vue             # Settings UI
│   │       └── main.ts
│   ├── components/                 # Reusable Vue components
│   ├── utils/
│   │   ├── annotator.ts           # Core annotation logic
│   │   ├── vocabulary-loader.ts   # Load and filter vocab
│   │   └── dom-observer.ts        # Watch for dynamic content
│   ├── assets/
│   │   └── topik-vocab.json       # 50+ TOPIK 1-2 words
│   └── types/
│       └── index.ts               # TypeScript interfaces
├── public/
│   ├── icon/
│   │   ├── 16.png
│   │   ├── 48.png
│   │   └── 128.png
│   └── _locales/                  # i18n (future)
├── wxt.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎨 Core Implementation

### 1. Content Script (`content.ts`)

**Job**: Find Korean text on any webpage, annotate vocabulary words with translations above them.

**Key Logic**:
```typescript
// Pseudo-code for Copilot context
class WordWiseAnnotator {
  // 1. Load TOPIK vocabulary based on user level (1, 2, or all)
  // 2. Walk through DOM, find text nodes with Korean characters
  // 3. For each text node:
  //    - Find matches from vocabulary (longest words first)
  //    - Replace with: <ruby><rt>translation</rt>korean_word</ruby>
  // 4. Watch for dynamic content (MutationObserver)
}
```

**Ruby Tag Magic**:
```html
<!-- This is what we generate -->
<ruby class="word-wise">
  <rt>friend</rt>
  친구
</ruby>

<!-- Browser renders as: -->
      friend
      친구
```

### 2. Vocabulary Data (`topik-vocab.json`)

**Structure**:
```json
[
  {
    "word": "안녕하세요",
    "level": 1,
    "translations": {
      "en": "Hello",
      "zh": "你好", 
      "ja": "こんにちは"
    },
    "pos": "expression"
  }
]
```

**Start with ~50 words**, expand later.

### 3. Popup UI (`App.vue`)

**Settings to implement**:
- ✅ Enable/Disable toggle
- ✅ Vocabulary level: TOPIK 1 | TOPIK 1-2 | All
- ✅ Translation language: EN | ZH | JA
- ✅ Show highlight under words (optional visual)
- 📊 Statistics: Words learned, Pages visited

### 4. Styling

```css
/* Key CSS - tells Copilot what we need */
ruby.word-wise {
  ruby-position: over;        /* Translation goes above */
}

ruby.word-wise rt {
  font-size: 0.55em;          /* Smaller than base text */
  color: #667eea;             /* Purple-blue color */
  font-weight: 600;
}

.word-wise-highlight {
  background: linear-gradient(transparent 60%, rgba(102, 126, 234, 0.12) 60%);
  /* Subtle underline effect */
}
```

---

## 🚦 Week 1 Implementation Plan

### Day 1-2: Setup + Basic Annotation ⚡

**Goal**: Can annotate a simple webpage with 5 words.

```bash
# 1. Initialize WXT project
pnpm create wxt

# 2. Install dependencies
pnpm install

# 3. Create files
# - src/entrypoints/content.ts
# - src/assets/topik-vocab.json (start with 10 words)

# 4. Implement basic annotator
# - Find text nodes with Korean
# - Match against vocabulary
# - Replace with <ruby> tags

# 5. Test on: https://ko.wikipedia.org
pnpm dev
```

**Copilot Prompts**:
- "Create a function that finds all text nodes containing Korean characters"
- "Replace Korean word with ruby tag, translation above"
- "Load JSON vocabulary file and filter by level"

### Day 3-4: Popup UI + Configuration 🎨

**Goal**: User can change settings, see them applied immediately.

```bash
# 1. Create Vue popup
# - src/entrypoints/popup/App.vue
# - Settings form with dropdowns

# 2. Chrome storage integration
# - Save settings to chrome.storage.sync
# - Load settings on content script init

# 3. Hot reload test
# - Change level → reload page → see different words
```

**Copilot Prompts**:
- "Create Vue component with toggle switch and dropdown selects"
- "Save form data to chrome.storage.sync"
- "Listen for storage changes and update annotations"

### Day 5: Dynamic Content + Performance 🔧

**Goal**: Works on SPAs (Twitter, Reddit), doesn't slow down pages.

```bash
# 1. Add MutationObserver
# - Watch for new DOM nodes
# - Debounce to avoid excessive processing

# 2. Optimize
# - Cache processed nodes (WeakSet)
# - Only process nodes with Korean text
# - Skip script/style tags

# 3. Test on dynamic sites
# - https://twitter.com (search Korean)
# - https://news.naver.com
```

**Copilot Prompts**:
- "Add MutationObserver that processes newly added nodes with 500ms debounce"
- "Skip already processed nodes using WeakSet"
- "Optimize tree walker to only accept text nodes with Korean"

### Day 6-7: Polish + Expand Vocabulary 💎

**Goal**: 50+ words, looks professional, ready to demo.

```bash
# 1. Expand vocabulary
# - Add 40 more TOPIK 1-2 words
# - Verify translations

# 2. UI polish
# - Better colors, spacing
# - Add icons
# - Smooth animations

# 3. Test on real sites
# - Korean news sites
# - Korean Wikipedia
# - Korean blogs

# 4. Create demo video/screenshots
```

---

## 🎯 Critical Implementation Details

### Avoiding Overlapping Matches

```typescript
// Problem: "한국어" matches both "한국" and "한국어"
// Solution: Sort by length (longest first), track replaced ranges

const words = vocabulary.keys().sort((a, b) => b.length - a.length);
const replacements: Array<{start: number, end: number}> = [];

// Only replace if not overlapping with existing replacements
```

### DOM Manipulation Strategy

```typescript
// DON'T: Modify textContent directly (loses event listeners)
// DO: Replace text node with new element

const span = document.createElement('span');
span.innerHTML = annotatedHTML;
textNode.parentNode.replaceChild(span, textNode);
```

### Performance Guards

```typescript
// Skip non-content elements
const SKIP_TAGS = ['script', 'style', 'noscript', 'iframe', 'svg'];

// Debounce dynamic content processing
let timeoutId: number | null = null;
const observer = new MutationObserver(() => {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => process(), 500);
});
```

---

## 🤖 GitHub Copilot Tips

### Good Prompts

✅ **Specific + Context**:
```typescript
// Find all text nodes containing Korean characters (가-힣)
// Skip script, style, and already processed nodes
function collectKoreanTextNodes(): Text[] {
```

✅ **Reference Similar Code**:
```typescript
// Like Furigana Maker, wrap word in ruby tag with translation above
function createRubyAnnotation(word: string, translation: string): string {
```

✅ **Explain Edge Cases**:
```typescript
// Handle overlapping words: if "한국어" and "한국" both match,
// prioritize longest match and skip overlapping positions
```

### Bad Prompts

❌ **Too Vague**:
```typescript
// Make it work
```

❌ **No Context**:
```typescript
// Annotate Korean
```

---

## 📝 TypeScript Interfaces

```typescript
// types/index.ts - Define these upfront for Copilot context

interface VocabEntry {
  word: string;
  level: 1 | 2 | 3;
  translations: {
    en: string;
    zh: string;
    ja: string;
  };
  pos?: 'noun' | 'verb' | 'adjective' | 'expression';
}

interface UserConfig {
  enabled: boolean;
  level: 1 | 2 | 3;
  targetLanguage: 'en' | 'zh' | 'ja';
  showHighlight: boolean;
}

interface AnnotatorOptions {
  vocabulary: Map<string, VocabEntry>;
  config: UserConfig;
}

interface TextReplacement {
  start: number;
  end: number;
  word: string;
  translation: string;
}
```

---

## 🧪 Test Checklist

### Must Test On

- [ ] **Static site**: https://ko.wikipedia.org/wiki/한국어
- [ ] **News site**: https://news.naver.com
- [ ] **Dynamic SPA**: Twitter Korean search
- [ ] **Complex layout**: Korean blog sites

### Verify

- [ ] Annotations appear above words (not to the side)
- [ ] Layout doesn't break (no text overlap)
- [ ] Performance is acceptable (no freezing)
- [ ] Settings persist after browser restart
- [ ] Works on dynamic content (infinite scroll, etc.)
- [ ] Can disable on specific sites (future feature)

---

## 🎬 First Coding Session - Quick Start

### Terminal Commands

```bash
# 1. Create project
cd wordwise_korean
pnpm create wxt

# When prompted:
# - Name: wordwise-korean
# - Template: vue-ts
# - Package manager: pnpm

# 2. Install
pnpm install

# 3. Create initial files
mkdir -p src/assets src/utils src/types
touch src/assets/topik-vocab.json
touch src/utils/annotator.ts
touch src/types/index.ts

# 4. Start dev mode
pnpm dev
# Opens Chrome with extension loaded
# Changes auto-reload!
```

### First File to Create: `topik-vocab.json`

✅ **COMPLETED** - Now contains 4,341 words:
- TOPIK I: 1,578 words
- TOPIK Ⅱ: 2,729 words

Started with 10 words, grew to comprehensive coverage!

### Second File: `content.ts` Skeleton

```typescript
// src/entrypoints/content.ts

import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['<all_urls>'],
  
  async main() {
    console.log('WordWise Korean loaded!');
    
    // TODO: Load vocabulary
    // TODO: Find Korean text nodes
    // TODO: Annotate with <ruby> tags
    // TODO: Inject styles
  }
});
```

**Now start asking Copilot**:
- "Load JSON vocabulary from assets folder"
- "Create function to find all text nodes with Korean characters"
- "Replace Korean words with ruby tags"

---

## 🎯 Success Criteria for Week 1

✅ **ALL COMPLETED!**

✅ Extension loads on any webpage
✅ Can annotate Korean words with translations
✅ Translations appear **above** words using `<ruby>` tags
✅ Popup UI lets you toggle on/off and change level
✅ Works on Korean Wikipedia without breaking layout
✅ Code is clean and has TypeScript types

**BONUS ACHIEVEMENTS:**
✅ 4,341 words from TOPIK I + II
✅ Verb/adjective conjugation matching (stem extraction)
✅ Vocabulary management scripts (CSV, PDF parsing, batch translation)
✅ Comprehensive documentation

---

## 💡 Pro Tips for Vibe Coding

1. **Start with HTML prototype first** - Test ruby tag rendering before writing extension code
2. **Test vocabulary matching in console** - Verify regex works before DOM manipulation
3. **Use `console.log` liberally** - See what's being matched and replaced
4. **Reload often** - WXT hot reloads, use it!
5. **Commit frequently** - Git commit after each working feature

---

## 📚 Resources

- **WXT Docs**: https://wxt.dev/
- **Ruby Tag Reference**: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby
- **Furigana Maker Source**: https://github.com/aiktb/FuriganaMaker (reference implementation)
- **Chrome Extension APIs**: https://developer.chrome.com/docs/extensions/

