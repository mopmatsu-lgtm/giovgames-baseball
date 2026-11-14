import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const htmlPages = ['index.html', 'game.html', 'about-game.html', 'guide.html', 'players.html', 'systems.html', 'faq.html', 'contact.html', 'privacy.html', '404.html'];

export default defineConfig(() => ({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'generate-spa-fallback',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist');
        const indexPath = path.resolve(distDir, 'index.html');
        const fallbackPath = path.resolve(distDir, '200.html');
        if (fs.existsSync(indexPath)) fs.copyFileSync(indexPath, fallbackPath);
      },
    },
  ],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  build: {
    // Keep the portal, information pages, and game entry point independently addressable.
    rollupOptions: {
      input: Object.fromEntries(htmlPages.map(page => [page.replace(/\.html$/, ''), path.resolve(__dirname, page)])),
    },
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true as const,
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  preview: { port: 3000, host: '0.0.0.0', allowedHosts: true as const },
}));
