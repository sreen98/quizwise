import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: filePath => (filePath.includes('flag-icons') ? false : undefined)
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/**/types.ts', 'src/app/main.tsx', 'src/vite-env.d.ts'],
      reporter: ['text-summary', 'text', 'html']
    },
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30_000
  }
});
