import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
export const trpc = createTRPCReact();
export const trpcClient = trpc.createClient({
    links: [
        httpBatchLink({
            url: `${import.meta.env.VITE_API_URL ?? ""}/api/trpc`,
        }),
    ],
});
