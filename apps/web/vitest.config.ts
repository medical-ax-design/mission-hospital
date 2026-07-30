import react from '@vitejs/plugin-react';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    name: '@ready-on/web',
    setupFiles: ['./vitest.setup.ts'],
  },
});
