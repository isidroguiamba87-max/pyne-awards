import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Sem VITE_SITE_URL as meta tags Open Graph ficam com caminhos relativos
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  process.env.VITE_SITE_URL = (env.VITE_SITE_URL ?? '').replace(/\/+$/, '')
  return {
    plugins: [react(), tailwindcss()],
  }
})
