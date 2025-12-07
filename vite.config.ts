import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Explicitly listen on all network interfaces
    port: 3000,
    strictPort: true, // Prevents switching ports if 3000 is busy
    cors: true, // Allow CORS
    hmr: {
      clientPort: 3000 // Ensures the mobile device connects back to the right port for HMR
    }
  }
});