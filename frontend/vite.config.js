import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Su GitHub Pages il sito vive in /Ripetizioni/: npm run build:pages
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    // In sviluppo le chiamate /api vanno al backend Node
    proxy: { '/api': 'http://localhost:3001' },
  },
});
