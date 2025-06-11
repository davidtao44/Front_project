import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Configuración para desarrollo (npm run dev)
    host: '0.0.0.0', // Necesario para Render
    port: process.env.PORT || 3000, // Usa el puerto de Render o 3000 localmente
    allowedHosts: [
      'front-project-n1rm.onrender.com', // Tu URL exacta en Render
      '.onrender.com' // Permite cualquier subdominio de Render
    ]
  },
  preview: {
    // Configuración para producción (npm run preview)
    host: '0.0.0.0', // Obligatorio en Render
    port: process.env.PORT || 4173, // Usa $PORT o el puerto por defecto de vite preview
    allowedHosts: [
      'front-project-n1rm.onrender.com',
      '.onrender.com'
    ]
  }
});