import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    federation({
      name: 'shell',
      remotes: {
        homeApp: 'http://localhost:5001/assets/remoteEntry.js',
        videoApp: 'http://localhost:5002/assets/remoteEntry.js',
        liveApp: 'http://localhost:5003/assets/remoteEntry.js',
        premiumApp: 'http://localhost:5004/assets/remoteEntry.js',
      },
      shared: ['shared']
    })
  ],
  build: {
    modulePreload: {
      resolveDependencies: () => []
    },
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: false,
    sourcemap: false
  },
  server: {
    port: 5000,
    strictPort: true,
    proxy: {
      '/api/news': {
        target: 'https://newsapi.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, ''),
        headers: {
          'X-Api-Key': '30ab448986cc4748be31108b9964f0c9'
        }
      }
    }
  },
  preview: {
    port: 5000,
    strictPort: true,
    proxy: {
      '/api/news': {
        target: 'https://newsapi.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, ''),
        headers: {
          'X-Api-Key': '30ab448986cc4748be31108b9964f0c9'
        }
      }
    }
  }
});
