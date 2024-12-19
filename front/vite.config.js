import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import handlebars from 'vite-plugin-handlebars'
import { VitePWA } from 'vite-plugin-pwa'
import getPWAConfig from './pwa.config'

const site_name = "Évents";
const site_description = "Explorez les événements autour de vous.";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  const env = loadEnv(mode, process.cwd())
  var config = {
    plugins: [
      vue(),
      handlebars({
        context: {
          base_url: env.VITE_BASE_URL,
          title: site_name,
          description: site_description,
          year: new Date().getFullYear()
        }
      }),
      VitePWA(getPWAConfig(site_name, site_description))
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
