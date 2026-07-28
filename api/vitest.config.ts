import { defineConfig } from 'vitest/config';

// npm test — лише юніт-тести
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
