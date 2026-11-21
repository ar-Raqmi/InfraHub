import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['domain/**/*.test.ts', 'lib/**/*.test.ts', 'functions/**/*.test.ts', 'components/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
  },
});
