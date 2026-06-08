import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  root: ".", // Define a raiz do projeto Vite como o diretório 'client'
  publicDir: ".", // Onde o index.html e outros assets estariam se não estivessem na raiz

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
