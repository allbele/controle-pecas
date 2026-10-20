import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/controle-pecas/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Controle de Peças',
        short_name: 'Peças',
        description: 'Saída, retorno e reposição de peças por evento.',
        lang: 'pt-BR',
        start_url: '/controle-pecas/',
        scope: '/controle-pecas/',
        display: 'standalone',
        background_color: '#f6f5f1',
        theme_color: '#1f4d3a',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/controle-pecas/index.html',
      },
    }),
  ],
})
