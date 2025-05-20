import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    host: "0.0.0.0",
    port: "3000",
    proxy: {
      // 只代理 process-full 到 5000
      '/api/v1/process-full': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '')
      },
      // 其他 /api/v1/* 依然走 3000
      '/api/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path
      },
      // 如需其它 voice 相关接口也走 5000，可自行添加
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
