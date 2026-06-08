import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        analysis: resolve(__dirname, 'analysis.html'),
        about: resolve(__dirname, 'about.html'),
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
      name: 'clean-urls',
      configureServer(server) {
        server.middlewares.use((req, _, next) => {
          const m = req.url.match(/^\/(analysis|about)(\?.*)?$/);
          if (m) {
            req.url = '/' + m[1] + '.html' + (m[2] || '');
          }
          next();
        });
      }
    }
  ]
})