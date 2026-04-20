import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En DEV con Docker: el backend corre en localhost:8080
// En PRD: Nginx hace el proxy internamente (docker-compose → backend:80)
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8080';

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
            // En DEV apunta al backend Docker local (:8080)
            // En PRD Nginx ya maneja el proxy internamente
            '/api/tickets': {
                target: backendUrl,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/tickets/, '')
            }
        }
    }
})
