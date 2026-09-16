import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

/** Origin only — no trailing slash. Vercel injects this at build time, not at request time. */
function publicApiUrl(mode: string) {
  const env = loadEnv(mode, import.meta.dirname, '')
  const raw =
    env.VITE_API_URL ||
    env.API_URL ||
    process.env.VITE_API_URL ||
    process.env.API_URL ||
    ''
  return raw.trim().replace(/\/$/, '')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiUrl = publicApiUrl(mode)

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    define: {
      // Force-inline so a Vercel Config var is in the client bundle even if Vite
      // skipped the VITE_ prefix (Vercel suggests renaming public vars).
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': { target: 'http://localhost:4000', changeOrigin: true },
        '/health': { target: 'http://localhost:4000', changeOrigin: true },
      },
    },
  }
})
