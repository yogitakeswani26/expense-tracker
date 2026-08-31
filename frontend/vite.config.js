import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    // PERFORMANCE: no client-side use for source maps in production (they
    // just add build time + deploy payload); Sentry/error tooling can
    // still request 'hidden' maps in CI later if source-mapped stack
    // traces become worth wiring up.
    sourcemap: false,
    // Warn (don't silently ship) if any single chunk balloons past 600KB
    // gzip-equivalent - route-level code splitting (see App.tsx) plus the
    // vendor split below should keep every chunk well under this.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // PERFORMANCE: split third-party deps into their own long-lived
        // vendor chunk(s), separate from app code. Vendor code changes far
        // less often than app code between deploys, so browsers keep it
        // cached across releases instead of re-downloading React etc. on
        // every deploy just because one page component changed.
        // Function form: this Vite build uses the rolldown bundler, which
        // (unlike classic Rollup) requires manualChunks as a function
        // rather than a static id-list object.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (/[\\/]node_modules[\\/](@tanstack[\\/]react-query|axios)[\\/]/.test(id)) {
            return 'vendor-query';
          }
          if (/[\\/]node_modules[\\/]recharts[\\/]/.test(id)) {
            return 'vendor-charts';
          }
          if (/[\\/]node_modules[\\/](react-hook-form|zod)[\\/]/.test(id)) {
            return 'vendor-forms';
          }
          return 'vendor';
        },
      },
    },
  },
  plugins: [
    react(),
    // PWA disabled in production due to Vercel CORS issues with manifest
    // Keep for development if needed, disable in production
    process.env.NODE_ENV !== 'production' && VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Expense Tracker',
        short_name: 'ExpenseTracker',
        description: 'Smart family expense tracking and management',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ].filter(Boolean),
  server: {
    port: 5173,
  }
})
