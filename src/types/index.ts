// TypeScript interfaces for WordWise Korean

export interface VocabEntry {
  word: string;
  level: 1 | 2 | 3;
  translations: {
    en: string;
    zh: string;
    ja: string;
  };
  pos?: 'noun' | 'verb' | 'adjective' | 'expression' | 'adverb' | 'particle';
}

export interface UserConfig {
  enabled: boolean;
  siteMode: 'all' | 'allowlist';
  allowedDomains: string[];
  level: 1 | 2 | 3;
  targetLanguage: 'en' | 'zh' | 'ja';
  showHighlight: boolean;
  fontSize: number; // Font size percentage (80-150)
}

export interface AnnotatorOptions {
  vocabulary: Map<string, VocabEntry>;
  config: UserConfig;
}

export interface TextReplacement {
  start: number;
  end: number;
  word: string;
  translation: string;
}

export const DEFAULT_CONFIG: UserConfig = {
  enabled: true,
  siteMode: 'all',
  allowedDomains: [],
  level: 2,
  targetLanguage: 'en',
  showHighlight: true,
  fontSize: 100, // Default 100% (was 0.5em, now 0.6em base)
};

export const STORAGE_KEYS = {
  CONFIG: 'wordwise_config',
  STATS: 'wordwise_stats',
} as const;
