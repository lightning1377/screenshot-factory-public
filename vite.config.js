// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // No specific config needed for basic GrapesJS usage,
  // but you can adjust 'root' here if your index.html isn't in the project root.
  build: {
    target: 'esnext', // Ensures modern JS features are supported
  },
  test: {
    environment: 'happy-dom',
    exclude: ['node_modules/**', 'dist/**'],
    globals: true,
  },
});
