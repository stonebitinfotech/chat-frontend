import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3100,
    proxy: {
      '/api': {
        target: 'http://localhost:5100',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5100',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5100',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (!['ECONNRESET', 'ECONNABORTED'].includes(err.code)) {
              console.error('[proxy] socket.io error:', err.message);
            }
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          socket: ['socket.io-client'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
