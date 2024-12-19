export default (name, description) => ({
  registerType: 'autoUpdate',
  injectRegister: null,

  manifest: {
    name: name,
    short_name: name,
    description: description,
    theme_color: '#3cb371',
    icons: [
      {
        src: 'pwa-64x64.png',
        sizes: '64x64',
        type: 'image/png'
      },
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: 'screenshots/map.jpg',
        sizes: '1386x701',
        label: 'Carte des événements',
      },
      {
        src: 'screenshots/search.jpg',
        sizes: '1386x701',
        label: 'Recherche d\'événements',
      },
    ],
    categories: ['entertainment', 'events', 'maps'],
  },

  workbox: {
    globPatterns: [
      '**/*.{js,css,html,svg,png,ico}',
      '**/langs/*.json',
    ],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
  },

  devOptions: {
    enabled: false,
    navigateFallback: 'index.html',
    suppressWarnings: true,
    type: 'module',
  },
});