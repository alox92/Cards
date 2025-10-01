import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Nouveau: détection modes & flags CI / diagnostics
const TEST_SUITE = process.env.TEST_SUITE || 'fast' // 'fast' | 'heavy'
const IS_FAST = TEST_SUITE === 'fast'
const USE_JUNIT = process.env.TEST_JUNIT === '1' || !!process.env.CI
const DIAGNOSTICS = process.env.DIAGNOSTICS === '1'

export default defineConfig({
  plugins: [react()],
  define: {
    __DIAGNOSTICS__: JSON.stringify(DIAGNOSTICS)
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/__tests__/setupTestEnv.ts'],
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/domain': path.resolve(__dirname, './src/domain'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/utils': path.resolve(__dirname, './src/utils')
    },
    // Nouveau: inclusion / exclusion dynamique selon mode
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx'
    ],
    exclude: [
      'node_modules',
      'dist',
      'coverage',
      IS_FAST ? 'src/**/*.heavy.test.ts' : '',
      IS_FAST ? 'src/**/*.heavy.spec.ts' : ''
    ].filter(Boolean),
    // Nouveau: reporters conditionnels (JUnit en CI)
    reporters: USE_JUNIT
      ? [
          'default',
          ['junit', { outputFile: 'coverage/junit-report.xml' }]
        ]
      : ['default'],
    // Réduction bruit logs en mode fast (ignore debug/traces verbeux)
    onConsoleLog(log, type) {
      if (IS_FAST && (type === 'debug' || type === 'trace')) return false
    },
    // Couverture: ajout thresholds + text-summary
    coverage: {
      reporter: ['text', 'text-summary', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      include: [
        'src/application/services/**/*.ts',
        'src/utils/performanceOptimizer.ts'
      ],
      exclude: [
        'src/__tests__/**',
        '**/node_modules/**'
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
})
