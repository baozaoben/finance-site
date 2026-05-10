import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    allowedHosts: ['.monkeycode-ai.online'],
    proxy: {
      '/api/news': {
        target: 'https://api.rss2json.com/v1/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, 'api.json'),
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        quotes: resolve(__dirname, 'quotes.html'),
        news: resolve(__dirname, 'news.html'),
        calendar: resolve(__dirname, 'calendar.html'),
        tools: resolve(__dirname, 'tools.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        about: resolve(__dirname, 'about.html'),
      },
    },
  },
});
