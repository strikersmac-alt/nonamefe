import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    host: true,            
    port: 5173, 
    allowedHosts: [
      '08a00fe8454c.ngrok-free.app' 
    ]
  }
})
