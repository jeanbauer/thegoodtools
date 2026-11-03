import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project site: https://<user>.github.io/thegoodtools/
  base: '/thegoodtools/',
  plugins: [react()],
})
