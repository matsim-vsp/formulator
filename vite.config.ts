import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/formulator/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
      '~': '/node_modules',
    },
  },
})
