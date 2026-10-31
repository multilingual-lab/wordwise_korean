import { defineContentScript } from 'wxt/sandbox';
import type { UserConfig } from '@/types';
import { STORAGE_KEYS } from '@/types';
import { loadVocabulary } from '@/utils/vocabulary-loader';
import { WordWiseAnnotator } from '@/utils/annotator';
import { DOMObserver } from '@/utils/dom-observer';
import { getUserConfig, isSiteEnabled } from '@/utils/site-policy';

const KOREAN_RE = /[가-힣]/;

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  registration: 'manifest',

  async main(ctx) {
    if (!document.body) return;

    let config: UserConfig | undefined;
    let annotator: WordWiseAnnotator | undefined;
    let observer: DOMObserver | undefined;
    let sentinel: MutationObserver | undefined;
    let settingsRevision = 0;
    let invalidated = false;
    const pageUrl = new URL(location.href);

    function stop(): void {
      sentinel?.disconnect();
      sentinel = undefined;
      observer?.stop();
      annotator?.clearAnnotations();
      observer = undefined;
      annotator = undefined;
      document.getElementById('wordwise-korean-styles')?.remove();
    }

    function initialize(): void {
      if (!config || !isSiteEnabled(config, pageUrl)) return;
      sentinel?.disconnect();
      sentinel = undefined;

      const vocabulary = loadVocabulary(config);
      if (annotator) {
        annotator.updateVocabulary(vocabulary);
        annotator.updateConfig(config);
      } else {
        annotator = new WordWiseAnnotator(vocabulary, config);
        observer = new DOMObserver(annotator);
      }
      injectStyles(config.fontSize);
      annotator.processNode(document.body);
      observer?.start();
    }

    function detectKorean(): void {
      if (KOREAN_RE.test(document.body.innerText)) {
        initialize();
        return;
      }
      sentinel = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          const text = mutation.type === 'characterData'
            ? (mutation.target.textContent ?? '')
            : Array.from(mutation.addedNodes).map(node => node.textContent ?? '').join('');
          if (KOREAN_RE.test(text)) {
            initialize();
            return;
          }
        }
      });
      sentinel.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    function applySettings(value: unknown): void {
      try {
        const next = getUserConfig(value);
        const previous = config;
        const wasEnabled = previous && isSiteEnabled(previous, pageUrl);
        config = next;
        if (!isSiteEnabled(next, pageUrl)) {
          // Do not touch the DOM at all on pages that have never been annotated.
          if (sentinel || annotator) stop();
          return;
        }
        if (wasEnabled && previous) {
          if (sentinel) return;
          if (annotator &&
            previous.level === next.level &&
            previous.targetLanguage === next.targetLanguage &&
            previous.showHighlight === next.showHighlight
          ) {
            annotator.updateConfig(next);
            if (previous.fontSize !== next.fontSize) updateFontSize(next.fontSize);
            return;
          }
        }
        if (annotator) stop();
        detectKorean();
      } catch (error) {
        config = undefined;
        if (sentinel || annotator) stop();
        console.error('WordWise Korean: Failed to apply settings; annotations paused.', error);
      }
    }

    const onChanged = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'sync' || !changes[STORAGE_KEYS.CONFIG]) return;
      settingsRevision++;
      applySettings(changes[STORAGE_KEYS.CONFIG].newValue);
    };
    chrome.storage.onChanged.addListener(onChanged);
    ctx.onInvalidated(() => {
      invalidated = true;
      chrome.storage.onChanged.removeListener(onChanged);
      if (sentinel || annotator) stop();
    });

    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
      // A settings event received during the read is newer than its snapshot.
      if (!invalidated && settingsRevision === 0) applySettings(result[STORAGE_KEYS.CONFIG]);
    } catch (error) {
      console.error('WordWise Korean: Failed to load settings.', error);
    }
  },
});

/**
 * Inject CSS styles for ruby tags and annotations
 */
function injectStyles(fontSize: number = 100): void {
  if (document.getElementById('wordwise-korean-styles')) {
    updateFontSize(fontSize);
    return;
  }

  const baseFontSize = 0.6; // Base size in em
  const fontSizeEm = (baseFontSize * fontSize) / 100;

  const style = document.createElement('style');
  style.id = 'wordwise-korean-styles';
  style.textContent = `
    /* Ruby tag styling for annotations */
    ruby.word-wise-korean {
      ruby-position: over;
      line-height: 2.2;
    }

    ruby.word-wise-korean rt {
      font-size: ${fontSizeEm}em; /* Dynamic based on user preference */
      color: inherit;
      font-weight: 500;
      line-height: 1;
      text-align: center;
      user-select: none;
      letter-spacing: 0;
    }

    /* Optional highlight under annotated words */
    ruby.word-wise-highlight {
      background: linear-gradient(transparent 70%, rgba(102, 126, 234, 0.12) 70%);
      border-radius: 2px;
      padding: 0 1px;
    }

    /* Prevent Ruby tags from breaking layout */
    ruby.word-wise-korean {
      display: inline-ruby;
    }
  `;

  document.head.appendChild(style);
  console.log(`WordWise Korean: Styles injected (fontSize: ${fontSize}%)`);
}

/**
 * Update font size dynamically
 */
function updateFontSize(fontSize: number): void {
  const styleElement = document.getElementById('wordwise-korean-styles');
  if (!styleElement) return;

  const baseFontSize = 0.6; // Base size in em
  const fontSizeEm = (baseFontSize * fontSize) / 100;

  // Update the font-size in the existing style
  styleElement.textContent = styleElement.textContent?.replace(
    /font-size: [\d.]+em;/,
    `font-size: ${fontSizeEm}em;`
  ) || '';
  
  console.log(`WordWise Korean: Font size updated to ${fontSize}% (${fontSizeEm}em)`);
}
