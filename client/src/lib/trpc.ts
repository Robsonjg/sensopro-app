import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL ?? ""}/api/trpc`,
      
      // CORRIGIDO: Injeta as credenciais de forma compatível com o TypeScript do tRPC
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include", // Garante o envio dos cookies cross-site (Vercel -> Railway)
        });
      },
    }),
  ],
});