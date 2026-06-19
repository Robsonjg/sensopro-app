import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";
import { httpBatchLink } from "@trpc/client";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      // Removido o "/api/trpc" daqui, já que ele já vem de dentro da variável
      url: `${import.meta.env.VITE_API_URL ?? ""}`,
    }),
  ],
});
