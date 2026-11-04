import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vitest/config';

/** Ships the classic single-file app at /legacy/ next to the React app,
 *  so it keeps working (and stays linkable) until every section is ported. */
function copyLegacy(): Plugin {
  return {
    name: 'copy-legacy-app',
    apply: 'build',
    closeBundle() {
      const src = resolve(__dirname, 'legacy');
      if (existsSync(src)) cpSync(src, resolve(__dirname, 'dist/legacy'), { recursive: true });
    },
  };
}

// Published at https://mjmelon.github.io/plantationstockmanagementsystem/
export default defineConfig({
  base: '/plantationstockmanagementsystem/',
  plugins: [react(), tailwindcss(), copyLegacy()],
  build: { sourcemap: false },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
