import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REVIEWS_PATH = join(__dirname, 'src', 'reviews.json');
const VIRTUAL_ID = '\0virtual:reviews-json';

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    {
      // When it doesn't exist (CI / production build) an empty object is returned.
      name: 'optional-reviews-json',
      resolveId(id) {
        if (id === '../reviews.json') return VIRTUAL_ID;
      },
      load(id) {
        if (id !== VIRTUAL_ID) return;
        if (existsSync(REVIEWS_PATH)) {
          return `export default ${readFileSync(REVIEWS_PATH, 'utf-8')}`;
        }
        return 'export default {};';
      },
    },
  ],
  base: '/',
});
