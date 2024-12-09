import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import handlebars from 'vite-plugin-handlebars'
import { VitePWA } from 'vite-plugin-pwa'
import PWAConfig from './pwa.config'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  const env = loadEnv(mode, process.cwd())
  var config = {
    plugins: [
      vue(),
      handlebars({
        context: {
          base_url: env.VITE_BASE_URL,
          description: 'Explorez les événements autour de vous',
          year: new Date().getFullYear()
        }
      }),
      VitePWA(PWAConfig)
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: env.VITE_BASE_URL,
    server: {}
  };
  if (env.VITE_API_URL)
    config.server.proxy = {
      [(env.VITE_BASE_URL ?? '') + '/api']: {
        target: env.VITE_API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace((env.VITE_BASE_URL ?? '') + '/api', '')
      }
    };
  return config;
})
