import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // base must match your GitHub repo name so assets load on GitHub Pages.
  // If you rename the repo, change this to '/<new-repo-name>/'.
  base: '/Game/',
  plugins: [react()],
  server: {
    host: true
  }
})
