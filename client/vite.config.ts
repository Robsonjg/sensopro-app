import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Reconstrói o __dirname de forma segura para compatibilidade entre Windows (local) e Linux (Vercel)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
    // Evita duplicação de instâncias do React na memória do bundle final
    dedupe: ["react", "react-dom"],
  },

  build: {
    sourcemap: false,
    // MODIFICADO: Força o build a subir um nível (../) e salvar na pasta dist da RAIZ do projeto.
    // Isso faz com que a Vercel ache o index.html imediatamente no diretório padrão.
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
    assetsDir: "assets",
  },
});