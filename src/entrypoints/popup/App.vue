<template>
  <div class="popup-container">
    <header class="header">
      <div class="header-inner">
        <div class="logo-mark">W</div>
        <div>
          <h1 class="title">WordWise Korean</h1>
          <p class="subtitle">Inline translations while you browse</p>
        </div>
      </div>
    </header>

    <main class="content">
      <!-- Enable/Disable Toggle -->
      <div class="setting-group">
        <div class="toggle-row">
          <div>
            <span class="setting-label">Annotations</span>
            <p class="setting-hint">Show translations above Korean words</p>
          </div>
          <label class="toggle-container">
            <input
              type="checkbox"
              v-model="config.enabled"
              @change="saveConfig"
              class="toggle-input"
            />
            <span class="toggle-track">
              <span class="toggle-thumb"></span>
            </span>
          </label>
        </div>
      </div>

      <div class="divider"></div>

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
        <label class="setting-label">Translation Language</label>
        <select
          v-model="config.targetLanguage"
          @change="saveConfig"
          class="lang-select"
        >
          <option value="en">English (EN)</option>
          <option value="zh">中文 — Chinese Simplified</option>
          <option value="ja">日本語 — Japanese</option>
        </select>
        <p class="setting-hint">{{ langHint }}</p>
      </div>

      <!-- Font Size -->
      <div class="setting-group">
        <label class="setting-label">
          Translation Size
          <span class="size-badge">{{ config.fontSize }}%</span>
        </label>
        <input
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
            />
            <span class="toggle-track">
              <span class="toggle-thumb"></span>
            </span>
          </label>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Landing page link -->
      <div class="info-section">
        <a class="landing-link" href="https://multilingual-lab.github.io/wordwise_korean/" target="_blank">
          Visit homepage ↗
        </a>
      </div>

      <!-- Save Status -->
      <transition name="fade">
        <div v-if="saveStatus" class="save-status">
          {{ saveStatus }}
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { UserConfig, VocabEntry } from '@/types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/types';
import vocabularyData from '@/assets/topik-vocab.json';

const _vocab = vocabularyData as VocabEntry[];
const vocabCounts = {
  1: _vocab.filter(e => e.level === 1).length,
  2: _vocab.filter(e => e.level === 2).length,
  all: _vocab.length,
};

const config = ref<UserConfig>({ ...DEFAULT_CONFIG });
const saveStatus = ref('');

const levelHint = computed(() => {
  switch (config.value.level) {
    case 1:
      return `TOPIK I - Basic vocabulary (${vocabCounts[1].toLocaleString()} words)`;
    case 2:
      return `TOPIK II - Intermediate/Advanced (${vocabCounts[2].toLocaleString()} words)`;
    case 3:
      return `All levels (${vocabCounts.all.toLocaleString()} words)`;
    default:
      return '';
  }
});

const langHint = computed(() => {
  switch (config.value.targetLanguage) {
    case 'en': return 'English translations';
    case 'zh': return 'Simplified Chinese translations';
    case 'ja': return 'Japanese translations';
    default:   return '';
  }
});

onMounted(async () => {
  // Load saved configuration
  const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
  if (result[STORAGE_KEYS.CONFIG]) {
    config.value = result[STORAGE_KEYS.CONFIG];
  }
});

async function saveConfig() {
  try {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.CONFIG]: config.value,
    });
    
    saveStatus.value = '✓ Saved';
    setTimeout(() => {
      saveStatus.value = '';
    }, 2000);
  } catch (error) {
    console.error('Popup: Failed to save config:', error);
    saveStatus.value = '✗ Save failed';
  }
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
.subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  color: #8f8fb8;
}

/* ── Content ── */
.content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-group {
  padding: 4px 0;
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
  width: 100%;
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

/* ── Divider ── */
.divider {
  height: 1px;
  background: #34344e;
  margin: 10px 0;
}

/* ── Info / landing link ── */
.info-section {
  background: #1d1d2e;
  border: 1px solid #34344e;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}
.landing-link {
  font-size: 12px;
  color: #a78bfa;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.landing-link:hover {
  color: #eeeef5;
}

/* ── Save status ── */
.save-status {
  margin-top: 8px;
  padding: 7px 10px;
  background: #1a0f35;
  border: 1px solid #5b3d9e;
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
  color: #a78bfa;
  font-weight: 600;
}

/* ── Fade transition ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
