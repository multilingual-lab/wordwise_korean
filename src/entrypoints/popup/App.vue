<template>
  <div class="popup-container">
    <header class="header">
      <h1 class="title">📚 WordWise Korean</h1>
      <p class="subtitle">Learn vocabulary while browsing</p>
    </header>

    <main class="content">
      <!-- Enable/Disable Toggle -->
      <div class="setting-group">
        <label class="toggle-container">
          <input
            type="checkbox"
            v-model="config.enabled"
            @change="saveConfig"
            class="toggle-input"
          />
          <span class="toggle-label">
            {{ config.enabled ? '✓ Enabled' : '✗ Disabled' }}
          </span>
        </label>
      </div>

      <div class="divider"></div>

      <!-- Vocabulary Level -->
      <div class="setting-group">
        <label class="setting-label">Vocabulary Level</label>
        <select 
          v-model.number="config.level" 
          @change="saveConfig"
          class="select-input"
        >
          <option :value="1">TOPIK I</option>
          <option :value="2">TOPIK Ⅱ</option>
          <option :value="3">All</option>
        </select>
        <p class="setting-hint">
          {{ levelHint }}
        </p>
      </div>

      <!-- Translation Language -->
      <div class="setting-group">
        <label class="setting-label">Translation Language</label>
        <select 
          v-model="config.targetLanguage" 
          @change="saveConfig"
          class="select-input"
        >
          <option value="en">🇬🇧 English</option>
          <option value="zh">🇨🇳 Chinese</option>
          <option value="ja">🇯🇵 Japanese</option>
        </select>
      </div>

      <!-- Show Highlight -->
      <div class="setting-group">
        <label class="checkbox-container">
          <input
            type="checkbox"
            v-model="config.showHighlight"
            @change="saveConfig"
            class="checkbox-input"
          />
          <span class="checkbox-label">Highlight annotated words</span>
        </label>
      </div>

      <div class="divider"></div>

      <!-- Instructions -->
      <div class="info-section">
        <h3 class="info-title">How to use:</h3>
        <ol class="info-list">
          <li>Enable the extension</li>
          <li>Visit any Korean website</li>
          <li>Translations appear above words!</li>
        </ol>
      </div>

      <!-- Save Status -->
      <div v-if="saveStatus" class="save-status">
        {{ saveStatus }}
      </div>
    </main>

    <footer class="footer">
      <p class="footer-text">Made with ❤️ for Korean learners</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { UserConfig } from '@/types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/types';

const config = ref<UserConfig>({ ...DEFAULT_CONFIG });
const saveStatus = ref('');

const levelHint = computed(() => {
  switch (config.value.level) {
    case 1:
      return 'TOPIK I - Basic vocabulary (~1,600 words)';
    case 2:
      return 'TOPIK II - Intermediate/Advanced (~2,700 words)';
    case 3:
      return 'All levels (~4,300 words)';
    default:
      return '';
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
.popup-container {
  width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #ffffff;
  color: #2d3748;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  margin: 5px 0 0;
  font-size: 13px;
  opacity: 0.9;
}

.content {
  padding: 16px;
}

.setting-group {
  margin-bottom: 16px;
}

.setting-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 6px;
}

.select-input {
  width: 100%;
  padding: 8px 10px;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.select-input:focus {
  outline: none;
  border-color: #667eea;
}

.setting-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #718096;
}

.toggle-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  position: relative;
  width: 48px;
  height: 26px;
  appearance: none;
  background: #cbd5e0;
  border-radius: 13px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-input:checked {
  background: #667eea;
}

.toggle-input::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 3px;
  left: 3px;
  transition: transform 0.3s;
}

.toggle-input:checked::before {
  transform: translateX(22px);
}

.toggle-label {
  margin-left: 12px;
  font-size: 15px;
  font-weight: 600;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-label {
  margin-left: 8px;
  font-size: 14px;
}

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 16px 0;
}

.info-section {
  background: #f7fafc;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.info-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.6;
  color: #718096;
}

.save-status {
  margin-top: 12px;
  padding: 8px;
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
  color: #22543d;
  font-weight: 600;
}

.footer {
  background: #f7fafc;
  padding: 12px;
  text-align: center;
  border-top: 1px solid #e2e8f0;
}

.footer-text {
  margin: 0;
  font-size: 12px;
  color: #718096;
}
</style>
