import type { VocabEntry, UserConfig, TextReplacement } from '@/types';
import { getTranslation } from './vocabulary-loader';
import { extractStemsForLookup, VERB_POS } from './korean-stem';

// Tags to skip during annotation
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'IFRAME',
  'SVG',
  'CODE',
  'PRE',
  'TEXTAREA',
  'INPUT',
]);

// Class name for our annotations
const ANNOTATION_CLASS = 'word-wise-korean';
const HIGHLIGHT_CLASS = 'word-wise-highlight';

/**
 * Main annotator class that processes text nodes and adds ruby tags
 */
export class WordWiseAnnotator {
  private vocabulary: Map<string, VocabEntry>;
  private config: UserConfig;
  private processedNodes = new WeakSet<Node>();
  private isUpdating = false; // Flag to prevent processing during updates

  constructor(vocabulary: Map<string, VocabEntry>, config: UserConfig) {
    this.vocabulary = vocabulary;
    this.config = config;
  }

  /**
   * Update configuration (e.g., when user changes settings)
   */
  updateConfig(config: UserConfig): void {
    this.config = config;
  }

  /**
   * Update vocabulary (e.g., when user changes level)
   */
  updateVocabulary(vocabulary: Map<string, VocabEntry>): void {
    this.vocabulary = vocabulary;
  }

  /**
   * Set updating flag to prevent processing during updates
   */
  setUpdating(value: boolean): void {
    this.isUpdating = value;
  }

  /**
   * Process a DOM node and its children to add annotations
   */
  processNode(node: Node): void {
    if (this.isUpdating) {
      return;
    }
    if (this.processedNodes.has(node)) return;
    if (!this.config.enabled) return;

    // Skip certain elements
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (SKIP_TAGS.has(element.tagName)) return;
      if (element.classList.contains(ANNOTATION_CLASS)) return;
      // Skip contenteditable elements to avoid conflicts with rich-text editors
      // (e.g., Notion reverts our DOM mutations causing infinite text corruption:
      // the <rt> translation leaks into textContent on revert, growing on each cycle)
      if (element.isContentEditable) return;
    }

    // Process text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = (node as Text).parentElement;
      if (parent?.isContentEditable) return;
      this.processTextNode(node as Text);
      return;
    }

    // Recursively process child nodes
    const children = Array.from(node.childNodes);
    for (const child of children) {
      this.processNode(child);
    }

    this.processedNodes.add(node);
    
    // Log annotation count at the root level (document.body)
    if (node === document.body) {
      const annotationCount = document.querySelectorAll(`ruby.${ANNOTATION_CLASS}`).length;
      console.log(`WordWise Korean: ✓ Added ${annotationCount} annotations (Vocab: ${this.vocabulary.size} words)`);
    }
  }

  /**
   * Process a single text node to annotate Korean words
   */
  private processTextNode(textNode: Text): void {
    const text = textNode.textContent || '';
    
    // Skip if no Korean characters
    if (!/[가-힣]/.test(text)) return;

    const replacements = this.findReplacements(text);
    if (replacements.length === 0) return;

    // Build HTML with ruby tags
    const html = this.buildAnnotatedHTML(text, replacements);
    
    // Replace text node with annotated HTML
    const span = document.createElement('span');
    span.innerHTML = html;
    textNode.parentNode?.replaceChild(span, textNode);
    this.processedNodes.add(span);
  }

  /**
   * Find all vocabulary words in text that should be annotated
   * Returns: array of replacements sorted by position
   * Now includes stem-based matching for conjugated verbs/adjectives
   */
  private findReplacements(text: string): TextReplacement[] {
    const replacements: TextReplacement[] = [];
    
    // Track which positions have been matched to avoid overlaps
    const matched = new Set<number>();

    // Split text into Korean words (sequences of Hangul)
    const koreanWordRegex = /[가-힣]+/g;
    let match;
    
    while ((match = koreanWordRegex.exec(text)) !== null) {
      const word = match[0];
      const index = match.index;
      
      // Skip if already matched
      if (matched.has(index)) continue;

      // Skip Korean tokens directly preceded by a digit — these are digit-Korean
      // compounds (counters/ordinals: 1심, 2층, 10명, 5월, 20살) where the standalone
      // vocab meaning of the Korean syllable is always wrong. A space between the
      // digit and the Korean word is safe: text[index-1] would be ' ', not a digit.
      if (index > 0 && /[0-9]/.test(text[index - 1])) continue;
      
      // First try exact match
      let entry = this.vocabulary.get(word);
      // If no exact match, try stem matching for verbs/adjectives
      if (!entry) {
        const candidates = extractStemsForLookup(word);
        // Pass 1: POS-aware — when a verb-only ending was stripped, reject noun matches
        // to prevent collisions like 서고→서 "west" shadowing 서다 "stand".
        for (const { stem, verbOnly } of candidates) {
          const candidate = this.vocabulary.get(stem);
          if (candidate && (!verbOnly || (candidate.pos != null && VERB_POS.has(candidate.pos)))) {
            entry = candidate;
            break;
          }
        }
        // Pass 2: graceful fallback — only relaxes the POS constraint when the
        // entry has no pos field (data gap). It still blocks nouns/pronouns when
        // verbOnly:true so we never annotate '서' "west" for '서고' "stand+and".
        if (!entry) {
          for (const { stem, verbOnly } of candidates) {
            const candidate = this.vocabulary.get(stem);
            if (!candidate) continue;
            // If pos is present and this was a verb-only stripped ending, enforce POS
            if (verbOnly && candidate.pos != null && !VERB_POS.has(candidate.pos)) continue;
            entry = candidate;
            break;
          }
        }
      }
      
      if (entry) {
        // Check if position overlaps with existing match
        let overlaps = false;
        for (let i = index; i < index + word.length; i++) {
          if (matched.has(i)) {
            overlaps = true;
            break;
          }
        }
        
        if (!overlaps) {
          const translation = getTranslation(entry, this.config.targetLanguage);
          
          replacements.push({
            start: index,
            end: index + word.length,
            word,  // Use the actual text word, not the dictionary form
            translation,
          });

          // Mark positions as matched
          for (let i = index; i < index + word.length; i++) {
            matched.add(i);
          }
        }
      }
    }

    // Sort by start position
    return replacements.sort((a, b) => a.start - b.start);
  }

  /**
   * Build HTML string with ruby tags for annotations
   */
  private buildAnnotatedHTML(text: string, replacements: TextReplacement[]): string {
    let html = '';
    let lastIndex = 0;

    for (const replacement of replacements) {
      // Add text before this replacement
      html += this.escapeHtml(text.slice(lastIndex, replacement.start));

      // Add ruby tag with annotation
      const highlightClass = this.config.showHighlight ? ` ${HIGHLIGHT_CLASS}` : '';
      html += `<ruby class="${ANNOTATION_CLASS}${highlightClass}">`;
      html += this.escapeHtml(replacement.word);
      html += `<rt>${this.escapeHtml(replacement.translation)}</rt>`;
      html += '</ruby>';

      lastIndex = replacement.end;
    }

    // Add remaining text
    html += this.escapeHtml(text.slice(lastIndex));

    return html;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Remove all annotations from the page
   */
  clearAnnotations(): void {
    console.log('WordWise Korean: Clearing annotations [v0.1.1]');
    
    // Strategy: Replace each ruby tag directly with its base text (excluding <rt>)
    const rubyTags = Array.from(document.querySelectorAll(`ruby.${ANNOTATION_CLASS}`));
    console.log(`WordWise Korean: Found ${rubyTags.length} ruby tags to remove`);
    
    let cleared = 0;
    rubyTags.forEach((ruby) => {
      try {
        // Get only the base text (Korean word) from ruby element
        // Ruby structure: <ruby>한국어<rt>Korean language</rt></ruby>
        // We want: 한국어 (skip the <rt> tag content)
        let baseText = '';
        
        ruby.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            // Direct text node - this is the Korean word
            baseText += node.textContent || '';
          }
          // Skip ELEMENT nodes (<rt> tags)
        });
        
        // Replace the ruby tag with just the base text
        const textNode = document.createTextNode(baseText);
        ruby.parentNode?.replaceChild(textNode, ruby);
        cleared++;
      } catch (error) {
        console.error('WordWise Korean: Error clearing ruby tag', error);
      }
    });
    
    console.log(`WordWise Korean: Cleared ${cleared} ruby tags`);
    
    // Now unwrap any remaining spans that were created during annotation
    const spans = Array.from(document.querySelectorAll('span'));
    let unwrapped = 0;
    
    spans.forEach((span) => {
      // Check if this span was created by us (has no other content than text now)
      // and has no class/id (our spans are plain)
      if (!span.className && !span.id && span.childNodes.length > 0) {
        // Check if all children are text nodes (after ruby removal)
        const allText = Array.from(span.childNodes).every(
          node => node.nodeType === Node.TEXT_NODE
        );
        
        if (allText && span.textContent) {
          try {
            const textNode = document.createTextNode(span.textContent);
            span.parentNode?.replaceChild(textNode, span);
            unwrapped++;
          } catch (error) {
            // Ignore - might be DOM changes
          }
        }
      }
    });
    
    if (unwrapped > 0) {
      console.log(`WordWise Korean: Unwrapped ${unwrapped} annotation containers`);
    }
    
    // Normalize to merge adjacent text nodes
    try {
      document.body.normalize();
    } catch (error) {
      console.error('WordWise Korean: Error normalizing', error);
    }
    
    // Reset processed nodes
    this.processedNodes = new WeakSet<Node>();
  }
}
