import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';

// Plugin para atualizar version.json no build
const updateVersionPlugin = () => ({
  name: 'update-version',
  buildStart() {
    const versionData = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      buildId: Date.now().toString()
    };
    
    fs.writeFileSync(
      path.resolve(__dirname, 'public/version.json'),
      JSON.stringify(versionData, null, 2)
    );
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  plugins: [
    react(),
    updateVersionPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Shopee IA Política de Proibidos',
        short_name: 'Shopee IA',
        description: 'Assistente IA para dúvidas sobre produtos proibidos na Shopee',
        theme_color: '#ff5722',
        background_color: '#fff8f1',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
