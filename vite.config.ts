import { copyFileSync, mkdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vitest/config';

/** Until the React app has every section, the live site (GitHub Pages
 *  "deploy from branch" = main root) serves the CLASSIC app from the root
 *  index.html. The React entry is app.html. In the build output the React
 *  app becomes dist/index.html and the classic app is shipped at /legacy/.
 *  Cutover: swap the two (see docs/security-cutover.md). */
function arrangeOutput(): Plugin {
  return {
    name: 'arrange-output',
    apply: 'build',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');
      renameSync(resolve(dist, 'app.html'), resolve(dist, 'index.html'));
      mkdirSync(resolve(dist, 'legacy'), { recursive: true });
      for (const f of ['index.html', 'sw.js', 'manifest.json']) copyFileSync(resolve(__dirname, f), resolve(dist, 'legacy', f));
    },
  };
}

// Published at https://oliviawsc.github.io/plantationstockmanagementsystem/
export default defineConfig({
  base: '/plantationstockmanagementsystem/',
  plugins: [react(), tailwindcss(), arrangeOutput()],
  build: { sourcemap: false, rollupOptions: { input: resolve(__dirname, 'app.html') } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
