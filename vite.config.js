import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/PolyVis/' : '/',
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@uwdata')) return 'vendor';
        }
      }
    }
  },
  plugins: [
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, _, next) => {
          const path = req.url.split('?')[0].split('#')[0];
          if (path === '/' || path === '/analysis' || path === '/patients' || path === '/about') {
            req.url = '/index.html';
          }
          next();
        });
      }
    }
  ]
}));
