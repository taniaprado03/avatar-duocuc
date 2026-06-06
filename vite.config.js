import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api/ideainmotion': {
                target: 'https://totem.ideainmotion.cl',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/ideainmotion/, '')
            },
            '/api/tickets': {
                target: 'https://cittsb.cl/asesor_totem',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/tickets/, '')
            }
        }
    }
})
