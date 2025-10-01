import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Forcer le format ES pour les Web Workers (évite erreur Rollup: worker.format iife non supporté avec code-splitting)
  worker: {
    format: 'es'
  },
  plugins: [
    react(),
  VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'vite.svg'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: 'offline.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              }
            }
          },
          {
            urlPattern: /\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
          // stratégie offline additionnelle gérée côté app (navigateFallback déjà configuré)
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/domain': path.resolve(__dirname, './src/domain'),
  '@/application': path.resolve(__dirname, './src/application'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/utils': path.resolve(__dirname, './src/utils')
    }
  },
  build: {
    target: 'esnext',
  sourcemap: process.env.VITE_DEBUG_SOURCEMAP === '1',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          state: ['zustand'],
          database: ['dexie'],
          charts: ['chart.js', 'react-chartjs-2'],
          animations: ['framer-motion']
        }
      }
    }
  },
  optimizeDeps: {
  include: ['react', 'react-dom', 'dexie']
  },
  server: {
  host: '127.0.0.1',
  port: 5173,
  strictPort: false,
  // Ouverture auto du navigateur contrôlée par env (Web-only)
    open: process.env.VITE_FORCE_OPEN === '1'
  }
})
