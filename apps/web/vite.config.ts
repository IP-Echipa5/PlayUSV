import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In dev, /api goes to the backend from apps/api, so no CORS is needed locally.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
