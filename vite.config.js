import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  const env = loadEnv(mode, process.cwd())
  var config = {
    plugins: [vue()],
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
