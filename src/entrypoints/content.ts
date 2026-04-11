import { defineContentScript } from 'wxt/sandbox';
import type { UserConfig } from '@/types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/types';
import { loadVocabulary } from '@/utils/vocabulary-loader';
import { WordWiseAnnotator } from '@/utils/annotator';
import { DOMObserver } from '@/utils/dom-observer';

const KOREAN_RE = /[가-힣]/;

export default defineContentScript({
  matches: ['<all_urls>'],
  registration: 'manifest',

  async main() {
    // Bail out on frames with no body (blank, hidden, or not yet loaded)
    if (!document.body) return;

    // Phase 1: fast Korean-presence check.
    // If the page already has Korean, go straight to full init.
    // Otherwise, watch for Korean to appear (SPAs, lazy-loaded content)
    // and only then pay the cost of loading vocabulary + annotator.
    if (KOREAN_RE.test(document.body.innerText)) {
      await initializeFull();
    } else {
      const sentinel = new MutationObserver((mutations, obs) => {
        for (const mutation of mutations) {
          // Check only the newly added/changed text — not the whole body
          const text =
            mutation.type === 'characterData'
              ? (mutation.target.textContent ?? '')
              : Array.from(mutation.addedNodes)
                  .map(n => n.textContent ?? '')
                  .join('');
          if (KOREAN_RE.test(text)) {
            obs.disconnect();
            initializeFull();
            return;
          }
        }
      });
      sentinel.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  },
});

/**
 * Full initialization — loads vocabulary, creates annotator, starts observer.
 * Only called once Korean text has been confirmed present on the page.
 */
async function initializeFull(): Promise<void> {
    console.log('========================================');
    console.log('WordWise Korean v0.1.3');
    console.log('========================================');

    // Load user configuration from storage
    const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
    const config: UserConfig = result[STORAGE_KEYS.CONFIG] || DEFAULT_CONFIG;

    // Load vocabulary based on user's level
    const vocabulary = loadVocabulary(config);
    console.log(`WordWise Korean: Loaded ${vocabulary.size} vocabulary words (Level ${config.level})`);

    // Create annotator
    const annotator = new WordWiseAnnotator(vocabulary, config);

    // Inject styles with user's font size preference
    injectStyles(config.fontSize);

    // Process initial page content
    if (config.enabled) {
      annotator.processNode(document.body);
    }

    // Set up observer for dynamic content
    const observer = new DOMObserver(annotator);
    if (config.enabled) {
      observer.start();
    }

    // Listen for configuration changes from popup
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;
      
      if (changes[STORAGE_KEYS.CONFIG]) {
        const oldConfig = (changes[STORAGE_KEYS.CONFIG].oldValue ?? DEFAULT_CONFIG) as UserConfig;
        const newConfig = (changes[STORAGE_KEYS.CONFIG].newValue ?? DEFAULT_CONFIG) as UserConfig;
        
        console.log('========================================');
        console.log('WordWise Korean: Config changed!');
        console.log('  Level:', oldConfig.level, '→', newConfig.level);
        console.log('  Lang:', oldConfig.targetLanguage, '→', newConfig.targetLanguage);
        console.log('  Highlight:', oldConfig.showHighlight, '→', newConfig.showHighlight);
        console.log('========================================');

        // If enabled state changed
        if (newConfig.enabled !== oldConfig.enabled) {
          if (newConfig.enabled) {
            // Stop observer, clear, re-annotate, restart observer
            annotator.setUpdating(true);
            observer.stop();
            
            setTimeout(() => {
              annotator.updateConfig(newConfig);
              annotator.clearAnnotations();
              annotator.setUpdating(false);
              annotator.processNode(document.body);
              observer.start();
            }, 100);
          } else {
            // Clear annotations and stop observing
            annotator.setUpdating(true);
            observer.stop();
            annotator.updateConfig(newConfig);
            annotator.clearAnnotations();
            annotator.setUpdating(false);
          }
        } else if (newConfig.enabled) {
          // If fontSize changed alone, just update styles without re-annotation
          if (newConfig.fontSize !== oldConfig.fontSize &&
              newConfig.level === oldConfig.level &&
              newConfig.targetLanguage === oldConfig.targetLanguage &&
              newConfig.showHighlight === oldConfig.showHighlight) {
            updateFontSize(newConfig.fontSize);
          }
          // If level, language, or highlight changed, re-annotate
          else if (
            newConfig.level !== oldConfig.level ||
            newConfig.targetLanguage !== oldConfig.targetLanguage ||
            newConfig.showHighlight !== oldConfig.showHighlight
          ) {
            annotator.setUpdating(true);
            observer.stop();
            
            setTimeout(() => {
              if (newConfig.level !== oldConfig.level) {
                const newVocabulary = loadVocabulary(newConfig);
                console.log(`WordWise Korean: Loaded ${newVocabulary.size} words for Level ${newConfig.level}`);
                annotator.updateVocabulary(newVocabulary);
              }
              
              annotator.updateConfig(newConfig);
              annotator.clearAnnotations();
              
              setTimeout(() => {
                annotator.setUpdating(false);
                annotator.processNode(document.body);
                observer.start();
              }, 100);
            }, 100);
          }
        }

        Object.assign(config, newConfig);
      }
    });

    console.log('WordWise Korean: Ready');
}

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
