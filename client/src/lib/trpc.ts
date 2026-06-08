import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../server/routers";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  // replace example.com with your actual production url
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
  return `http://localhost:${process.env.PORT ?? 3001}`;
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
