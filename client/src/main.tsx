import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React from "react";
import ReactDOM from "react-dom/client";
import superjson from "superjson";
import { trpc } from "./lib/trpc";
import App from "./App";
import "./index.css";

console.log("🚀 main.tsx carregado");

// Validar que React está disponível
if (!React || !ReactDOM) {
  console.error("❌ React ou ReactDOM não estão disponíveis!");
  throw new Error("React dependencies not loaded");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// URL da API - dinâmica por ambiente
const getApiUrl = () => {
  // 1. Verificar variável de ambiente
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    console.log("📡 API URL (env):", envUrl);
    return envUrl;
  }

  // 2. Fallback para localhost em desenvolvimento
  const isDev = typeof window !== "undefined" && 
                (window.location.hostname === "localhost" || 
                 window.location.hostname === "127.0.0.1");
  
  if (isDev) {
    const url = "http://localhost:3001/api/trpc";
    console.log("📡 API URL (dev):", url);
    return url;
  }
  
  // 3. Em produção, use a mesma origem
  const url = `${window.location.origin}/api/trpc`;
  console.log("📡 API URL (prod):", url);
  return url;
};

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getApiUrl(),
      transformer: superjson,
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
      },
    }),
  ],
});

// Garantir que o root existe
const root = document.getElementById("root");
if (!root) {
  console.error("❌ Elemento #root não encontrado no DOM!");
  document.body.innerHTML = "<h1>Erro: Elemento root não encontrado</h1>";
  throw new Error("Root element not found");
}

console.log("✅ Elemento #root encontrado");

try {
  const reactRoot = ReactDOM.createRoot(root);
  console.log("✅ ReactDOM.createRoot inicializado");

  reactRoot.render(
    <React.StrictMode>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </React.StrictMode>
  );

  console.log("✅ App renderizado com sucesso!");
} catch (error) {
  console.error("❌ Erro ao renderizar app:", error);
  root.innerHTML = `<h1>Erro ao carregar aplicação</h1><pre>${String(error)}</pre>`;
}
