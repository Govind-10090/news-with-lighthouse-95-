import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    federation({
      name: 'videoApp',
      filename: 'remoteEntry.js',
      exposes: {
        './Video': './src/mount.js'
      },
      shared: ['shared']
    })
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: false
  },
  server: {
    port: 5002,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  preview: {
    port: 5002,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
});
