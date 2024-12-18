import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import handlebars from 'vite-plugin-handlebars'
import { VitePWA } from 'vite-plugin-pwa'
import getPWAConfig from './pwa.config'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  const env = loadEnv(mode, process.cwd())
  var config = {
    plugins: [
      vue(),
      handlebars({
        context: {
          base_url: env.VITE_BASE_URL,
          site_name: env.VITE_SITE_NAME,
          description: env.VITE_SITE_DESCRIPTION,
          year: new Date().getFullYear()
        }
      }),
      VitePWA(getPWAConfig(env))
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: env.VITE_BASE_URL,
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/shared" as *;'
        }
      }
    }
  };
  return config;
})
