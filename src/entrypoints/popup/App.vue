<template>
  <div class="popup-container">
    <header class="header">
      <div class="header-inner">
        <div class="logo-mark">W</div>
        <div class="header-brand">
          <h1 class="title">WordWise Korean</h1>
          <a
            class="landing-link"
            href="https://multilingual-lab.github.io/wordwise_korean/"
            target="_blank"
            rel="noopener noreferrer"
          >Visit homepage ↗</a>
        </div>
        <label class="toggle-container header-toggle" title="Enable annotations">
          <input
            type="checkbox"
            v-model="config.enabled"
            @change="saveConfig"
            class="toggle-input"
            aria-label="Enable annotations"
            :disabled="!settingsLoaded"
          />
          <span class="toggle-track">
            <span class="toggle-thumb"></span>
          </span>
        </label>
      </div>
    </header>

    <main class="content">
      <p class="setting-hint site-status" role="status">{{ siteStatus }}</p>
      <div v-if="loadError" class="error-message" role="alert">
        {{ loadError }}
        <button class="site-button" @click="loadConfig">Retry</button>
      </div>
      <fieldset class="settings-fields" :disabled="!settingsLoaded" aria-label="Annotation settings">
      <div class="settings-tabs" role="tablist" aria-label="Settings categories">
        <button
          v-for="(tab, index) in settingsTabs"
          :key="tab.id"
          :id="`tab-${tab.id}`"
          type="button"
          class="settings-tab"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :aria-controls="`panel-${tab.id}`"
          :tabindex="activeTab === tab.id ? 0 : -1"
          @click="activeTab = tab.id"
          @keydown="navigateTabs($event, index)"
        >{{ tab.label }}</button>
      </div>

      <section
        id="panel-websites"
        class="settings-panel"
        role="tabpanel"
        aria-labelledby="tab-websites"
        :hidden="activeTab !== 'websites'"
        tabindex="0"
      >
      <div class="setting-group">
        <label class="setting-label" for="site-mode">Run on</label>
        <select id="site-mode" v-model="config.siteMode" class="lang-select" @change="saveConfig">
          <option value="all">All websites</option>
          <option value="allowlist">Only listed websites</option>
        </select>
        <p v-if="currentSiteError" class="error-message" role="alert">{{ currentSiteError }}</p>

        <template v-if="config.siteMode === 'allowlist'">
          <template v-if="currentDomain">
            <p class="setting-hint domain-name">Current website: {{ currentDomain }}</p>
            <button
              v-if="isCurrentDomainListed"
              class="site-button"
              @click="removeDomain(currentDomain)"
            >Remove this website</button>
            <button
              v-else-if="!coveringDomain"
              class="site-button"
              @click="addCurrentDomain"
            >Add this website</button>
            <p v-else class="setting-hint">
              Included by {{ coveringDomain }}. Remove that entry below to disable this site.
            </p>
          </template>
          <details class="domain-manager">
            <summary>Manage allowed websites ({{ config.allowedDomains.length }})</summary>
            <ul v-if="config.allowedDomains.length" class="domain-list">
              <li v-for="domain in config.allowedDomains" :key="domain">
                <span class="domain-name">{{ domain }}</span>
                <button class="site-button" :aria-label="`Remove ${domain}`" @click="removeDomain(domain)">
                  Remove
                </button>
              </li>
            </ul>
            <p v-else class="setting-hint">No websites listed. Add one to enable annotations.</p>
            <form class="domain-form" @submit.prevent="addDomain">
              <label class="setting-hint" for="new-domain">Domain or HTTP(S) URL</label>
              <div class="domain-input-row">
                <input
                  id="new-domain"
                  v-model="domainInput"
                  class="domain-input"
                  placeholder="x.com or https://x.com/home"
                  :aria-invalid="Boolean(domainError)"
                  aria-describedby="domain-help domain-error"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  @input="domainError = ''"
                />
                <button class="site-button" type="submit">Add</button>
              </div>
              <p id="domain-error" v-if="domainError" class="error-message" role="alert">{{ domainError }}</p>
            </form>
          </details>
          <p id="domain-help" class="setting-hint">Domains include their subdomains. Changes apply immediately.</p>
        </template>
      </div>
      </section>

      <section
        id="panel-learning"
        class="settings-panel"
        role="tabpanel"
        aria-labelledby="tab-learning"
        :hidden="activeTab !== 'learning'"
        tabindex="0"
      >
      <!-- Vocabulary Level -->
      <div class="setting-group">
        <label class="setting-label">Vocabulary Level</label>
        <div class="level-pills">
          <button
            v-for="(label, val) in { 1: 'TOPIK I', 2: 'TOPIK II', 3: 'All' }"
            :key="val"
            class="pill-btn"
            :class="{ active: config.level === Number(val) }"
            @click="config.level = Number(val); saveConfig()"
          >{{ label }}</button>
        </div>
        <p class="setting-hint">{{ levelHint }}</p>
      </div>

      <!-- Translation Language -->
      <div class="setting-group">
        <label class="setting-label" for="translation-language">Translation Language</label>
        <select
          id="translation-language"
          v-model="config.targetLanguage"
          @change="saveConfig"
          class="lang-select"
        >
          <option value="en">English (EN)</option>
          <option value="zh">中文 — Chinese Simplified</option>
          <option value="ja">日本語 — Japanese</option>
        </select>
      </div>
      </section>

      <section
        id="panel-appearance"
        class="settings-panel"
        role="tabpanel"
        aria-labelledby="tab-appearance"
        :hidden="activeTab !== 'appearance'"
        tabindex="0"
      >
      <!-- Font Size -->
      <div class="setting-group">
        <label class="setting-label" for="translation-size">
          Translation Size
          <span class="size-badge">{{ config.fontSize }}%</span>
        </label>
        <input
          id="translation-size"
          type="range"
          v-model.number="config.fontSize"
          @input="saveConfig"
          min="80"
          max="150"
          step="5"
          class="slider-input"
        />
        <div class="size-labels">
          <span>Small</span>
          <span>Normal</span>
          <span>Large</span>
        </div>
      </div>

      <!-- Show Highlight -->
      <div class="setting-group">
        <div class="toggle-row">
          <span class="setting-label">Highlight words</span>
          <label class="toggle-container">
            <input
              type="checkbox"
              v-model="config.showHighlight"
              @change="saveConfig"
              class="toggle-input"
              aria-label="Highlight annotated words"
            />
            <span class="toggle-track">
              <span class="toggle-thumb"></span>
            </span>
          </label>
        </div>
      </div>
      </section>
      </fieldset>

      <!-- Save Status -->
      <transition name="fade">
        <div
          v-if="saveStatus"
          class="save-status"
          :class="{ 'save-status-error': saveStatus.startsWith('✗') }"
          role="status"
          aria-live="polite"
        >
          {{ saveStatus }}
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { UserConfig, VocabEntry } from '@/types';
import { STORAGE_KEYS } from '@/types';
import { getUserConfig, isSiteEnabled, normalizeDomain } from '@/utils/site-policy';
import vocabularyData from '@/assets/topik-vocab.json';

const _vocab = vocabularyData as VocabEntry[];
const vocabCounts = {
  1: _vocab.filter(e => e.level === 1).length,
  2: _vocab.filter(e => e.level === 2).length,
  all: _vocab.length,
};

const config = ref<UserConfig>(getUserConfig(undefined));
const settingsTabs = [
  { id: 'learning', label: 'Learning' },
  { id: 'websites', label: 'Websites' },
  { id: 'appearance', label: 'Appearance' },
] as const;
const activeTab = ref<(typeof settingsTabs)[number]['id']>('learning');
const saveStatus = ref('');
const settingsLoaded = ref(false);
const loadError = ref('');
const currentSiteError = ref('');
const currentUrl = ref<URL>();
const currentDomain = ref('');
const domainInput = ref('');
const domainError = ref('');
let lastSavedConfig = getUserConfig(undefined);
let saveQueue = Promise.resolve();
let saveRevision = 0;
let statusTimeout: ReturnType<typeof setTimeout> | undefined;

const isCurrentDomainListed = computed(() => config.value.allowedDomains.includes(currentDomain.value));
const coveringDomain = computed(() => {
  const url = currentUrl.value;
  return url && config.value.allowedDomains.find(domain =>
    isSiteEnabled({
      ...config.value, enabled: true, siteMode: 'allowlist', allowedDomains: [domain],
    }, url),
  );
});
const siteStatus = computed(() => {
  if (!currentUrl.value || !['http:', 'https:'].includes(currentUrl.value.protocol)) {
    return currentSiteError.value ? 'Current website unavailable' : 'Unavailable on this browser page';
  }
  if (!settingsLoaded.value) return 'Loading settings...';
  if (!config.value.enabled) return 'Paused - annotations switched off';
  return isSiteEnabled(config.value, currentUrl.value)
    ? `Enabled on ${currentDomain.value}`
    : 'Inactive - website not listed';
});

const levelHint = computed(() => {
  switch (config.value.level) {
    case 1:
      return `TOPIK I · ${vocabCounts[1].toLocaleString()} words`;
    case 2:
      return `TOPIK II · ${vocabCounts[2].toLocaleString()} words`;
    case 3:
      return `All levels · ${vocabCounts.all.toLocaleString()} words`;
    default:
      return '';
  }
});

onMounted(() => {
  void loadConfig();
  void loadCurrentSite();
});

onUnmounted(() => {
  clearTimeout(statusTimeout);
});

function navigateTabs(event: KeyboardEvent, index: number): void {
  let next: number;
  switch (event.key) {
    case 'ArrowRight': next = (index + 1) % settingsTabs.length; break;
    case 'ArrowLeft': next = (index + settingsTabs.length - 1) % settingsTabs.length; break;
    case 'Home': next = 0; break;
    case 'End': next = settingsTabs.length - 1; break;
    default: return;
  }
  event.preventDefault();
  activeTab.value = settingsTabs[next].id;
  document.getElementById(`tab-${activeTab.value}`)?.focus();
}

async function loadConfig(): Promise<void> {
  loadError.value = '';
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
    config.value = getUserConfig(result[STORAGE_KEYS.CONFIG]);
    lastSavedConfig = getUserConfig(config.value);
    settingsLoaded.value = true;
  } catch (error) {
    console.error('Popup: Failed to load config:', error);
    loadError.value = 'Could not load settings. Please retry.';
  }
}

async function loadCurrentSite(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      currentSiteError.value = 'The current tab URL is unavailable. You can still add domains manually.';
      return;
    }
    currentUrl.value = new URL(tab.url);
    if (['http:', 'https:'].includes(currentUrl.value.protocol)) {
      currentDomain.value = normalizeDomain(tab.url);
    }
  } catch (error) {
    console.error('Popup: Failed to read current website:', error);
    currentUrl.value = undefined;
    currentDomain.value = '';
    currentSiteError.value = 'Could not read the current website. You can still add domains manually.';
  }
}

function addDomain(): void {
  try {
    const domain = normalizeDomain(domainInput.value);
    if (config.value.allowedDomains.includes(domain)) {
      domainError.value = 'This domain is already listed.';
      return;
    }
    config.value.allowedDomains.push(domain);
    domainInput.value = '';
    domainError.value = '';
    void saveConfig();
  } catch (error) {
    domainError.value = error instanceof Error ? error.message : 'Enter a valid domain.';
  }
}

function addCurrentDomain(): void {
  config.value.allowedDomains.push(currentDomain.value);
  void saveConfig();
}

function removeDomain(domain: string): void {
  config.value.allowedDomains = config.value.allowedDomains.filter(entry => entry !== domain);
  void saveConfig();
}

function saveConfig(): Promise<void> {
  const snapshot = getUserConfig(config.value);
  const revision = ++saveRevision;
  clearTimeout(statusTimeout);
  saveStatus.value = 'Saving...';
  // Serialize writes so rapid controls cannot persist an older snapshot last.
  saveQueue = saveQueue.then(async () => {
    try {
      await chrome.storage.sync.set({ [STORAGE_KEYS.CONFIG]: snapshot });
      lastSavedConfig = snapshot;
      if (revision === saveRevision) {
        saveStatus.value = '✓ Saved';
        statusTimeout = setTimeout(() => { saveStatus.value = ''; }, 2000);
      }
    } catch (error) {
      console.error('Popup: Failed to save config:', error);
      if (revision === saveRevision) {
        config.value = getUserConfig(lastSavedConfig);
        saveStatus.value = '✗ Save failed. Changes were not saved; please try again.';
      }
    }
  });
  return saveQueue;
}
</script>

<style scoped>
/* ── Design tokens (mirrors landing page) ── */
:root {
  --bg:         #13131f;
  --surface:    #1d1d2e;
  --surface2:   #25253a;
  --border:     #34344e;
  --text:       #eeeef5;
  --muted:      #8f8fb8;
  --purple:     #8b5cf6;
  --purple-hi:  #a78bfa;
  --purple-lo:  #251550;
  --radius:     12px;
}

.popup-container {
  width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #13131f;
  color: #eeeef5;
  line-height: 1.5;
}

/* ── Header ── */
.header {
  background: #1d1d2e;
  border-bottom: 1px solid #34344e;
  padding: 16px 18px;
}
.header-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-brand {
  flex: 1;
  min-width: 0;
}

.header-toggle {
  margin-left: auto;
}

.header-toggle .toggle-input:disabled + .toggle-track {
  opacity: 0.6;
  cursor: not-allowed;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 900;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(139,92,246,0.4);
}
.title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #eeeef5;
  letter-spacing: -0.01em;
}
/* ── Content ── */
.content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-group {
  padding: 4px 0;
}

.settings-fields {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.settings-fields:disabled {
  opacity: 0.6;
}

.settings-tabs {
  display: flex;
  border-bottom: 1px solid #34344e;
  margin-bottom: 20px;
}

.settings-tab {
  flex: 1;
  padding: 9px 4px;
  margin-bottom: -1px;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: #8f8fb8;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.settings-tab[aria-selected="true"] {
  border-bottom-color: #8b5cf6;
  color: #a78bfa;
}

.settings-tab:hover {
  color: #eeeef5;
}

.settings-tab:focus-visible,
.settings-panel:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

.settings-panel {
  padding: 3px;
}

#panel-websites {
  max-height: 220px;
  overflow-y: auto;
}

.settings-panel:not([hidden]) {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.site-status {
  color: #a78bfa;
  margin: 0;
  overflow-wrap: anywhere;
}

.site-button {
  padding: 5px 8px;
  margin: 4px 0;
  background: #25253a;
  border: 1px solid #34344e;
  border-radius: 6px;
  color: #eeeef5;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.site-button:hover {
  border-color: #8b5cf6;
}

.site-button:focus-visible,
.domain-input:focus-visible,
.domain-manager summary:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

.domain-manager {
  margin-top: 8px;
  font-size: 12px;
}

.domain-manager summary {
  cursor: pointer;
  color: #a78bfa;
}

.domain-list {
  list-style: none;
  padding: 0;
  margin: 8px 0;
  max-height: 120px;
  overflow-y: auto;
}

.domain-list li,
.domain-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.domain-name {
  overflow-wrap: anywhere;
  min-width: 0;
  flex: 1;
}

.domain-input {
  width: 100%;
  min-width: 0;
  padding: 7px;
  background: #1d1d2e;
  border: 1px solid #34344e;
  border-radius: 6px;
  color: #eeeef5;
  font: inherit;
}

.error-message {
  color: #ffb4b4;
  font-size: 12px;
}

.toggle-input:focus-visible + .toggle-track {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #eeeef5;
  margin-bottom: 6px;
}

.size-badge {
  margin-left: auto;
  background: #25253a;
  border: 1px solid #34344e;
  border-radius: 999px;
  padding: 1px 9px;
  font-size: 11px;
  font-weight: 600;
  color: #a78bfa;
}

.setting-hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: #8f8fb8;
}

/* ── Toggle row ── */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toggle-container {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}
.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-track {
  display: block;
  width: 42px;
  height: 24px;
  background: #34344e;
  border-radius: 999px;
  transition: background 0.25s;
  position: relative;
}
.toggle-input:checked + .toggle-track {
  background: #8b5cf6;
  box-shadow: 0 0 12px rgba(139,92,246,0.45);
}
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.25s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(18px);
}

/* ── Level pills ── */
.level-pills {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}
.pill-btn {
  flex: 1;
  padding: 6px 0;
  border-radius: 8px;
  border: 1px solid #34344e;
  background: #1d1d2e;
  color: #8f8fb8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  font-family: inherit;
}
.pill-btn:hover {
  border-color: #8b5cf6;
  color: #eeeef5;
}
.pill-btn.active {
  background: #251550;
  border-color: #8b5cf6;
  color: #a78bfa;
  box-shadow: 0 0 0 1px #8b5cf6 inset, 0 0 12px rgba(139,92,246,0.15);
}

/* ── Slider ── */
.slider-input {
  display: block;
  width: 100%;
  margin: 0;
  height: 4px;
  border-radius: 2px;
  background: #34344e;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}
.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(139,92,246,0.5);
  transition: transform 0.15s;
}
.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}
.slider-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  border: none;
}
.size-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 10px;
  color: #8f8fb8;
}

/* ── Language dropdown ── */
.lang-select {
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #34344e;
  background: #1d1d2e;
  color: #eeeef5;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238f8fb8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
  margin-bottom: 6px;
  transition: border-color 0.18s;
}
.lang-select:hover,
.lang-select:focus {
  border-color: #8b5cf6;
}
.lang-select option {
  background: #1d1d2e;
  color: #eeeef5;
}

.landing-link {
  display: inline-block;
  margin-top: 2px;
  font-size: 11px;
  color: #8f8fb8;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.landing-link:hover,
.landing-link:focus-visible {
  color: #eeeef5;
}

/* ── Save status ── */
.save-status {
  font-size: 11px;
  color: #a78bfa;
}

.save-status-error {
  padding: 8px 10px;
  border: 1px solid #ffb4b4;
  border-radius: 8px;
  color: #ffb4b4;
}

/* ── Fade transition ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
