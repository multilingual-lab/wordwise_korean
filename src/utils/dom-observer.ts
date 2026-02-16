import type { WordWiseAnnotator } from './annotator';

/**
 * Set up MutationObserver to watch for dynamic content changes
 * Processes newly added nodes with debouncing to avoid performance issues
 */
export class DOMObserver {
  private observer: MutationObserver | null = null;
  private annotator: WordWiseAnnotator;
  private timeoutId: number | null = null;
  private pendingNodes: Node[] = [];
  private debounceMs: number;

  constructor(annotator: WordWiseAnnotator, debounceMs = 500) {
    this.annotator = annotator;
    this.debounceMs = debounceMs;
  }

  /**
   * Start observing DOM changes
   */
  start(): void {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            this.pendingNodes.push(node);
          });
        }
      }

      this.scheduleProcessing();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Stop observing DOM changes
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Clear pending nodes to prevent processing old mutations
    this.pendingNodes = [];
  }

  /**
   * Schedule processing of pending nodes with debounce
   */
  private scheduleProcessing(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.processPendingNodes();
      this.timeoutId = null;
    }, this.debounceMs);
  }

  /**
   * Process all pending nodes
   */
  private processPendingNodes(): void {
    if (this.pendingNodes.length === 0) return;

    const nodes = this.pendingNodes;
    this.pendingNodes = [];

    for (const node of nodes) {
      try {
        this.annotator.processNode(node);
      } catch (error) {
        console.error('WordWise Korean: Error processing node', error);
      }
    }
  }
}
