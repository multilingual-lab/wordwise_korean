import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, STORAGE_KEYS, type UserConfig } from '@/types';

type SettingsListener = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string,
) => void;
type TestContext = { onInvalidated: (callback: () => void) => void };
type TestMutation = { type: string; target: { textContent: string }; addedNodes: { textContent: string }[] };

const mocks = vi.hoisted(() => ({
  main: async (_ctx: TestContext): Promise<void> => { throw new Error('Entrypoint not loaded'); },
  loadVocabulary: vi.fn(() => new Map()),
  processNode: vi.fn(),
  clearAnnotations: vi.fn(),
  updateConfig: vi.fn(),
  updateVocabulary: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('wxt/sandbox', () => ({
  defineContentScript: (definition: { main: (ctx: TestContext) => Promise<void> }) => {
    mocks.main = definition.main;
    return definition;
  },
}));
vi.mock('@/utils/vocabulary-loader', () => ({ loadVocabulary: mocks.loadVocabulary }));
vi.mock('@/utils/annotator', () => ({
  WordWiseAnnotator: class {
    processNode = mocks.processNode;
    clearAnnotations = mocks.clearAnnotations;
    updateConfig = mocks.updateConfig;
    updateVocabulary = mocks.updateVocabulary;
  },
}));
vi.mock('@/utils/dom-observer', () => ({
  DOMObserver: class {
    start = mocks.start;
    stop = mocks.stop;
  },
}));

import '@/entrypoints/content';

describe('content script website lifecycle', () => {
  let listener: SettingsListener;
  let invalidate: () => void;
  let saved: UserConfig;
  let readSettings: ReturnType<typeof vi.fn>;
  let text: string;
  let scans: number;
  let styles: Map<string, { id: string; textContent: string; remove: () => void }>;
  let sentinels: {
    callback: (mutations: TestMutation[]) => void;
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }[];

  const start = () => mocks.main({ onInvalidated: callback => { invalidate = callback; } });
  function change(patch: Partial<UserConfig>, area = 'sync'): void {
    saved = { ...saved, ...patch };
    listener({ [STORAGE_KEYS.CONFIG]: { newValue: saved } }, area);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    saved = { ...DEFAULT_CONFIG, siteMode: 'allowlist', allowedDomains: ['x.com'] };
    text = '한국어';
    scans = 0;
    sentinels = [];
    styles = new Map();
    readSettings = vi.fn(async () => ({ [STORAGE_KEYS.CONFIG]: saved }));
    vi.stubGlobal('location', { href: 'https://x.com/home' });
    vi.stubGlobal('chrome', {
      storage: {
        sync: { get: readSettings },
        onChanged: {
          addListener: (callback: SettingsListener) => { listener = callback; },
          removeListener: vi.fn(),
        },
      },
    });
    vi.stubGlobal('document', {
      body: { get innerText() { scans++; return text; } },
      getElementById: (id: string) => styles.get(id),
      createElement: () => {
        const style = { id: '', textContent: '', remove: () => { styles.delete(style.id); } };
        return style;
      },
      head: {
        appendChild: (style: { id: string; textContent: string; remove: () => void }) => {
          styles.set(style.id, style);
        },
      },
    });
    vi.stubGlobal('MutationObserver', class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(public callback: (mutations: TestMutation[]) => void) {
        sentinels.push(this);
      }
    });
  });

  afterEach(() => {
    invalidate?.();
    vi.unstubAllGlobals();
  });

  it('does not scan, observe, load vocabulary, or alter styles on unlisted pages', async () => {
    vi.stubGlobal('location', { href: 'https://unlisted.example/' });
    await start();
    expect(scans).toBe(0);
    expect(sentinels).toHaveLength(0);
    expect(mocks.loadVocabulary).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
    expect(styles.size).toBe(0);
    expect(mocks.clearAnnotations).not.toHaveBeenCalled();
  });

  it('activates and clears the current page immediately as the list changes', async () => {
    saved.allowedDomains = [];
    await start();
    change({ allowedDomains: ['x.com'] });
    expect(mocks.processNode).toHaveBeenCalledOnce();
    expect(mocks.start).toHaveBeenCalledOnce();
    change({ allowedDomains: [] });
    expect(mocks.stop).toHaveBeenCalledOnce();
    expect(mocks.clearAnnotations).toHaveBeenCalledOnce();
    expect(styles.size).toBe(0);
  });

  it('cancels the Korean sentinel when disallowed and uses latest settings on reactivation', async () => {
    text = 'No Korean yet';
    await start();
    expect(sentinels).toHaveLength(1);
    expect(mocks.loadVocabulary).not.toHaveBeenCalled();
    change({ allowedDomains: [] });
    expect(sentinels[0].disconnect).toHaveBeenCalledOnce();
    change({ level: 1, targetLanguage: 'ja', fontSize: 140 });
    text = '한국어';
    change({ allowedDomains: ['x.com'] });
    expect(mocks.loadVocabulary).toHaveBeenLastCalledWith(expect.objectContaining({
      level: 1, targetLanguage: 'ja', fontSize: 140,
    }));
    expect(styles.get('wordwise-korean-styles')?.textContent).toContain('font-size: 0.84em;');
  });

  it('starts on later Korean text with the latest settings', async () => {
    text = 'No Korean yet';
    await start();
    change({ targetLanguage: 'ja' });
    sentinels[0].callback([{ type: 'characterData', target: { textContent: '한국어' }, addedNodes: [] }]);
    expect(sentinels[0].disconnect).toHaveBeenCalledOnce();
    expect(mocks.loadVocabulary).toHaveBeenLastCalledWith(expect.objectContaining({ targetLanguage: 'ja' }));
    expect(mocks.processNode).toHaveBeenCalledOnce();
  });

  it('has no delayed restart after rapid mode and global-toggle changes', async () => {
    vi.useFakeTimers();
    try {
      await start();
      change({ level: 1 });
      change({ enabled: false });
      change({ enabled: true });
      change({ allowedDomains: [] });
      const starts = mocks.start.mock.calls.length;
      vi.runAllTimers();
      expect(mocks.start).toHaveBeenCalledTimes(starts);
      expect(styles.size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('updates font size without rebuilding annotations, and ignores unrelated list changes', async () => {
    await start();
    change({ fontSize: 150 });
    change({ allowedDomains: ['x.com', 'chat.example.com'] });
    expect(mocks.processNode).toHaveBeenCalledOnce();
    expect(mocks.clearAnnotations).not.toHaveBeenCalled();
    expect(styles.get('wordwise-korean-styles')?.textContent).toContain('font-size: 0.9em;');
  });

  it('lets each frame use its own hostname', async () => {
    vi.stubGlobal('location', { href: 'https://embedded.example/chat' });
    await start();
    expect(mocks.processNode).not.toHaveBeenCalled();
    change({ allowedDomains: ['x.com', 'embedded.example'] });
    expect(mocks.processNode).toHaveBeenCalledOnce();
  });

  it('does not let an initial storage snapshot override a newer change', async () => {
    let resolveRead: (value: object) => void = () => { throw new Error('Read not started'); };
    readSettings.mockImplementation(() => new Promise(resolve => { resolveRead = resolve; }));
    const pending = start();
    change({ allowedDomains: [] });
    resolveRead({ [STORAGE_KEYS.CONFIG]: DEFAULT_CONFIG });
    await pending;
    expect(mocks.processNode).not.toHaveBeenCalled();
    expect(scans).toBe(0);
  });

  it('does not initialize after its context is invalidated during a storage read', async () => {
    let resolveRead: (value: object) => void = () => { throw new Error('Read not started'); };
    readSettings.mockImplementation(() => new Promise(resolve => { resolveRead = resolve; }));
    const pending = start();
    invalidate();
    resolveRead({ [STORAGE_KEYS.CONFIG]: saved });
    await pending;
    expect(mocks.processNode).not.toHaveBeenCalled();
  });

  it('reports invalid settings and pauses instead of enabling all sites', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await start();
      listener({ [STORAGE_KEYS.CONFIG]: { newValue: { siteMode: 'invalid' } } }, 'sync');
      expect(error).toHaveBeenCalledWith(
        'WordWise Korean: Failed to apply settings; annotations paused.', expect.any(Error),
      );
      expect(mocks.clearAnnotations).toHaveBeenCalledOnce();
      expect(styles.size).toBe(0);
    } finally {
      error.mockRestore();
    }
  });
});
