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
  level: 1 | 2 | 3;
  targetLanguage: 'en' | 'zh' | 'ja';
  showHighlight: boolean;
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
  level: 2,
  targetLanguage: 'en',
  showHighlight: true,
};

export const STORAGE_KEYS = {
  CONFIG: 'wordwise_config',
  STATS: 'wordwise_stats',
} as const;
