import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  publicDir: 'public',
  manifest: {
    name: 'WordWise Korean',
    description: 'Add Word Wise style annotations to Korean text for language learning',
    version: '0.1.3',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content-scripts/content.js'],
      },
    ],
  },
  vite: () => ({
    plugins: [vue()],
  }),
});
