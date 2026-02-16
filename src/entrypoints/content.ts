import { defineContentScript } from 'wxt/sandbox';
import type { UserConfig } from '@/types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/types';
import { loadVocabulary } from '@/utils/vocabulary-loader';
import { WordWiseAnnotator } from '@/utils/annotator';
import { DOMObserver } from '@/utils/dom-observer';

export default defineContentScript({
  matches: ['<all_urls>'],
  registration: 'manifest',
  
  async main() {
    console.log('========================================');
    console.log('WordWise Korean: v2.2.5 - FIX: Exclude common grammar particles (은/는/이/가/etc.)');
    console.log('========================================');

    // Load user configuration from storage
    const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
    const config: UserConfig = result[STORAGE_KEYS.CONFIG] || DEFAULT_CONFIG;

    // Load vocabulary based on user's level
    const vocabulary = loadVocabulary(config);
    console.log(`WordWise Korean: Loaded ${vocabulary.size} vocabulary words (Level ${config.level})`);

    // Create annotator
    const annotator = new WordWiseAnnotator(vocabulary, config);

    // Inject styles
    injectStyles();

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
        const oldConfig = changes[STORAGE_KEYS.CONFIG].oldValue as UserConfig;
        const newConfig = changes[STORAGE_KEYS.CONFIG].newValue as UserConfig;
        
        console.log('========================================');
        console.log('WordWise Korean: Config changed!');
        console.log('  Level:', oldConfig.level, '→', newConfig.level);
        console.log('  Lang:', oldConfig.targetLanguage, '→', newConfig.targetLanguage);
        console.log('  Highlight:', oldConfig.showHighlight, '→', newConfig.showHighlight);
        console.log('========================================');

        // DON'T update annotator config yet - we need to check what changed first

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
          // If level, language, or highlight changed, re-annotate
          if (
            newConfig.level !== oldConfig.level ||
            newConfig.targetLanguage !== oldConfig.targetLanguage ||
            newConfig.showHighlight !== oldConfig.showHighlight
          ) {
            // Set updating flag to prevent observer interference
            annotator.setUpdating(true);
            
            // Stop observer to prevent interference
            observer.stop();
            
            // Small delay to ensure observer is fully stopped
            setTimeout(() => {
              // Load new vocabulary (only needed if level changed)
              if (newConfig.level !== oldConfig.level) {
                const newVocabulary = loadVocabulary(newConfig);
                console.log(`WordWise Korean: Loaded ${newVocabulary.size} words for Level ${newConfig.level}`);
                annotator.updateVocabulary(newVocabulary);
              }
              
              // NOW update the annotator config (after vocabulary is updated)
              annotator.updateConfig(newConfig);
              
              // Clear old annotations
              annotator.clearAnnotations();
              
              // Small delay before re-annotating
              setTimeout(() => {
                // Re-enable processing
                annotator.setUpdating(false);
                
                // Re-process page
                annotator.processNode(document.body);
                
                // Restart observer
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
});

/**
 * Inject CSS styles for ruby tags and annotations
 */
function injectStyles(): void {
  if (document.getElementById('wordwise-korean-styles')) return;

  const style = document.createElement('style');
  style.id = 'wordwise-korean-styles';
  style.textContent = `
    /* Ruby tag styling for annotations */
    ruby.word-wise-korean {
      ruby-position: over;
      line-height: 2.2;
    }

    ruby.word-wise-korean rt {
      font-size: 0.5em;
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
  console.log('WordWise Korean: Styles injected');
}
