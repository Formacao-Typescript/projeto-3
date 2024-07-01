import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    target: 'es2022'
  },
  test: {
    coverage: {
      enabled: true,
      include: ['src/**/*.ts'],
      exclude: ['src/app.ts', 'src/config.ts', '**/index.ts']
    },
    passWithNoTests: true
  }
})
