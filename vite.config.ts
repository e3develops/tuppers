import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'

// Identificador de esta compilación: la app lo compara con version.json al arrancar
// y, si hay una versión más nueva publicada, se actualiza sola.
const VERSION = new Date().toISOString()

function versionFile(): Plugin {
  return {
    name: 'tuppers-version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: VERSION }) })
    },
  }
}

export default defineConfig({
  base: '/tuppers/',
  define: { __APP_VERSION__: JSON.stringify(VERSION) },
  build: {
    // Sintaxis compatible con Safari 12 (iOS 12) en el bundle moderno
    target: ['es2015', 'safari12'],
  },
  plugins: [
    vue(),
    legacy({
      targets: ['ios >= 12', 'safari >= 12'],
      modernTargets: ['ios >= 12', 'safari >= 12', 'chrome >= 64', 'firefox >= 67', 'edge >= 79'],
      modernPolyfills: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png', 'favicon.png'],
      manifest: {
        name: 'Tuppers',
        short_name: 'Tuppers',
        description: 'Mis comidas de la semana, la compra y el modo cocina.',
        lang: 'es',
        display: 'standalone',
        start_url: '/tuppers/',
        scope: '/tuppers/',
        background_color: '#0E1116',
        theme_color: '#0E1116',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,woff2,mp4}'],
        globIgnores: ['**/version.json'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
    versionFile(),
  ],
})
