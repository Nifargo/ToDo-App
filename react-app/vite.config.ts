import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/ToDo-App/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Мої Справи - ToDo List',
        short_name: 'Мої Справи',
        description: 'Простий та зручний додаток для управління завданнями',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/ToDo-App/',
        scope: '/ToDo-App/',
        lang: 'uk',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'icons/icon-167.png',
            sizes: '167x167',
            type: 'image/png',
          },
          {
            src: 'icons/icon-180.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        categories: ['productivity', 'utilities'],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'query-vendor': ['@tanstack/react-query', 'zustand'],
          'ui-vendor': ['lucide-react', 'react-swipeable'],
          'date-vendor': ['date-fns'],
          'utils-vendor': ['clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
