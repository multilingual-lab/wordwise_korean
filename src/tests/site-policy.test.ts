import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '@/types';
import { getUserConfig, isSiteEnabled, normalizeDomain } from '@/utils/site-policy';

describe('domain normalization', () => {
  it.each([
    [' X.COM ', 'x.com'],
    ['https://X.com:443/home?q=korean#posts', 'x.com'],
    ['https://x.com/@name?search=*@mentions', 'x.com'],
    ['www.x.com.', 'www.x.com'],
    ['https://한국어.com/path', 'xn--3e0bk47br7k.com'],
    ['localhost:3000', 'localhost'],
    ['http://127.0.0.1:8080/chat', '127.0.0.1'],
    ['http://[::1]:8080/chat', '[::1]'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });

  it.each([
    '', '*.x.com', 'https://user:pass@x.com', 'https://@x.com',
    'file:///tmp/chat', 'chrome://settings', 'x.com/home', 'x .com',
    'https://bad_domain.com', '-bad.com', 'x..com', 'x.com..', 'com',
    'https://x.com\\@evil.com', 'https://', 'x.com:invalid',
  ])('rejects invalid input %s', input => {
    expect(() => normalizeDomain(input)).toThrow();
  });
});

describe('website activation', () => {
  const config = getUserConfig({ siteMode: 'allowlist', allowedDomains: ['x.com', 'chat.example.com'] });

  it.each([
    ['https://x.com/home', true],
    ['https://www.x.com/', true],
    ['https://mobile.x.com:8080/', true],
    ['https://X.COM./home', true],
    ['https://notx.com/', false],
    ['https://x.com.example.org/', false],
    ['https://example.org/?site=x.com', false],
    ['https://chat.example.com/room', true],
    ['https://www.example.com/', false],
    ['https://twitter.com/', false],
    ['chrome://settings/', false],
    ['about:blank', false],
  ])('applies hostname boundaries to %s', (url, expected) => {
    expect(isSiteEnabled(config, new URL(url))).toBe(expected);
  });

  it('keeps global off authoritative in both modes', () => {
    for (const siteMode of ['all', 'allowlist'] as const) {
      expect(isSiteEnabled({ ...config, enabled: false, siteMode }, new URL('https://x.com'))).toBe(false);
    }
  });

  it('allows HTTP(S) in all mode, but not browser pages or files', () => {
    expect(isSiteEnabled(DEFAULT_CONFIG, new URL('https://unlisted.example'))).toBe(true);
    expect(isSiteEnabled(DEFAULT_CONFIG, new URL('http://localhost:3000'))).toBe(true);
    expect(isSiteEnabled(DEFAULT_CONFIG, new URL('file:///test.html'))).toBe(false);
  });

  it('treats an empty allowlist as inactive everywhere', () => {
    expect(isSiteEnabled({ ...config, allowedDomains: [] }, new URL('https://x.com'))).toBe(false);
  });

  it('matches IP addresses exactly, not as suffixes', () => {
    const ipConfig = getUserConfig({ siteMode: 'allowlist', allowedDomains: ['127.0.0.1', '[::1]'] });
    expect(isSiteEnabled(ipConfig, new URL('http://127.0.0.1:8080'))).toBe(true);
    expect(isSiteEnabled(ipConfig, new URL('https://sub.127.0.0.1.example'))).toBe(false);
    expect(isSiteEnabled(ipConfig, new URL('http://[::1]:8080'))).toBe(true);
  });
});

describe('configuration compatibility', () => {
  it('preserves old settings while adding all-site defaults', () => {
    const config = getUserConfig({ enabled: false, level: 1, targetLanguage: 'ja', fontSize: 125 });
    expect(config).toEqual({
      ...DEFAULT_CONFIG, enabled: false, level: 1, targetLanguage: 'ja', fontSize: 125,
    });
  });

  it('normalizes and deduplicates saved domains', () => {
    expect(getUserConfig({ allowedDomains: ['X.COM', 'https://x.com/home'] }).allowedDomains).toEqual(['x.com']);
  });

  it('returns independent default lists', () => {
    getUserConfig(undefined).allowedDomains.push('x.com');
    expect(getUserConfig(undefined).allowedDomains).toEqual([]);
    expect(DEFAULT_CONFIG.allowedDomains).toEqual([]);
  });

  it.each([
    'invalid', [], { siteMode: 'invalid' }, { allowedDomains: [42] },
    { allowedDomains: ['*.x.com'] }, { enabled: 'yes' }, { fontSize: NaN },
  ])('reports malformed settings instead of silently enabling all sites', value => {
    expect(() => getUserConfig(value)).toThrow();
  });
});
