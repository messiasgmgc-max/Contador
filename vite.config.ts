import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { execSync } from 'child_process'

let commitHash = ''
let commitDate = ''
try {
  commitHash = execSync('git rev-parse HEAD').toString().trim()
  commitDate = execSync('git log -1 --format=%cd --date=iso').toString().trim()
} catch {
  commitHash = 'dev'
  commitDate = new Date().toISOString()
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    __BUILD_COMMIT__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(commitDate),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})

