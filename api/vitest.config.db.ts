import { defineConfig } from 'vitest/config';

// npm run test:db - тести на живій базі, потрібен піднятий postdres
// файли працюють зі спільними рядками в одній базі - паралелізм вимкнений
export default defineConfig({
  test: {
    include: ['tests/db/**/*.test.ts'],
    setupFiles: ['tests/db/load-env.ts'],
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
