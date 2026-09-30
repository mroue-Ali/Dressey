import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The web app reuses the mobile app's plain-TypeScript modules (availability rules,
// row mapping, money totals, labels) and its brand assets through the @mobile alias.
const mobile = fileURLToPath(new URL('../mobile', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@mobile': mobile } },
  server: { fs: { allow: ['.', mobile] } },
  build: {
    rolldownOptions: {
      output: {
        // Libraries in their own chunks: smaller files, and they stay cached across app updates.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/](@supabase|iceberg-js)[\\/]/ },
          ],
        },
      },
    },
  },
});
