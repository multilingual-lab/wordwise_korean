import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  publicDir: 'public',
  runner: {
    startUrls: ['https://blog.naver.com'],
  },
  zip: {
    includeSources: ['src/tests/**'],
  },
  manifest: {
    name: 'WordWise Korean',
    description: 'Add Word Wise style annotations to Korean text for language learning',
    version: '0.1.5',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
  },
  vite: () => ({
    plugins: [vue()],
  }),
});
