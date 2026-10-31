import { DEFAULT_CONFIG, type UserConfig } from '@/types';

export function normalizeDomain(input: string): string {
  const value = input.trim();
  if (!value || value.includes('\\')) {
    throw new Error('Enter a domain or an HTTP(S) URL without credentials or wildcards.');
  }

  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
  const authority = (hasScheme ? value.slice(value.indexOf('://') + 3) : value).split(/[/?#]/, 1)[0];
  if (/[\s*@]/.test(authority)) {
    throw new Error('Enter a domain or an HTTP(S) URL without credentials or wildcards.');
  }
  if (!hasScheme && /[/?#]/.test(value)) {
    throw new Error('Enter a domain, or include https:// when pasting a URL.');
  }

  let url: URL;
  try {
    url = new URL(hasScheme ? value : `https://${value}`);
  } catch {
    throw new Error('Enter a valid domain or HTTP(S) URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Only HTTP(S) websites without credentials are supported.');
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const isIPv6 = hostname.startsWith('[') && hostname.endsWith(']');
  const validLabels = hostname.split('.').every(label =>
    /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/.test(label),
  );
  if (!isIPv6 && (
    hostname.length > 253 ||
    !validLabels ||
    (!hostname.includes('.') && hostname !== 'localhost')
  )) {
    throw new Error('Enter a valid domain, IP address, or localhost.');
  }
  return hostname;
}

export function getUserConfig(value: unknown): UserConfig {
  if (value !== undefined && value !== null && (typeof value !== 'object' || Array.isArray(value))) {
    throw new Error('Saved settings are invalid.');
  }
  const saved = value ?? {};
  const enabled = 'enabled' in saved ? saved.enabled : DEFAULT_CONFIG.enabled;
  const siteMode = 'siteMode' in saved ? saved.siteMode : DEFAULT_CONFIG.siteMode;
  const allowedDomains = 'allowedDomains' in saved ? saved.allowedDomains : [];
  const level = 'level' in saved ? saved.level : DEFAULT_CONFIG.level;
  const targetLanguage = 'targetLanguage' in saved ? saved.targetLanguage : DEFAULT_CONFIG.targetLanguage;
  const showHighlight = 'showHighlight' in saved ? saved.showHighlight : DEFAULT_CONFIG.showHighlight;
  const fontSize = 'fontSize' in saved ? saved.fontSize : DEFAULT_CONFIG.fontSize;

  if (
    typeof enabled !== 'boolean' ||
    (siteMode !== 'all' && siteMode !== 'allowlist') ||
    !Array.isArray(allowedDomains) || !allowedDomains.every((domain: unknown) => typeof domain === 'string') ||
    (level !== 1 && level !== 2 && level !== 3) ||
    (targetLanguage !== 'en' && targetLanguage !== 'zh' && targetLanguage !== 'ja') ||
    typeof showHighlight !== 'boolean' ||
    typeof fontSize !== 'number' || !Number.isFinite(fontSize) || fontSize < 80 || fontSize > 150
  ) {
    throw new Error('Saved settings are invalid.');
  }

  return {
    enabled, siteMode, level, targetLanguage, showHighlight, fontSize,
    allowedDomains: [...new Set(allowedDomains.map(normalizeDomain))],
  };
}

export function isSiteEnabled(config: UserConfig, url: URL): boolean {
  if (!config.enabled || !['http:', 'https:'].includes(url.protocol)) return false;
  if (config.siteMode === 'all') return true;

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  return config.allowedDomains.some(domain =>
    hostname === domain ||
    (!/^[\d.]+$/.test(domain) && !domain.startsWith('[') && hostname.endsWith(`.${domain}`)),
  );
}
