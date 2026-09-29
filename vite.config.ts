/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'

/** Serves the Cloudflare Pages Function locally so food search works in `npm run dev`. */
function devApi(): Plugin {
  return {
    name: 'myfit-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/food-search', async (req, res) => {
        const mod = await server.ssrLoadModule('/functions/api/food-search.ts')
        const r: Response = await mod.onRequestGet({ request: new Request(`http://localhost${req.originalUrl}`) })
        res.statusCode = r.status
        res.setHeader('content-type', 'application/json')
        res.end(await r.text())
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    devApi(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'MyFit',
        short_name: 'MyFit',
        description: 'Personal fitness and weight tracking. Progress never resets.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#161826',
        theme_color: '#161826',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
