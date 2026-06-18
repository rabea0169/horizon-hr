import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";
import { toast } from "sonner";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      console.error("[Query Cache Error]", error);
      const msg = error?.message || "فشلت عملية جلب البيانات من الخادم";
      toast.error(`خطأ في جلب البيانات: ${msg}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      console.error("[Mutation Cache Error]", error);
      const msg = error?.message || "فشلت العملية، يرجى التحقق من المدخلات والاتصال";
      toast.error(`خطأ في التنفيذ: ${msg}`);
    },
  }),
});
const getApiUrl = () => {
  const storedUrl = typeof window !== "undefined" ? localStorage.getItem("hr_server_url") : null;
  if (storedUrl) {
    const cleanUrl = storedUrl.endsWith("/") ? storedUrl.slice(0, -1) : storedUrl;
    return `${cleanUrl}/api/trpc`;
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  // If running from file:// (Electron or portable distribution without storage config)
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    return "http://localhost:3000/api/trpc";
  }
  return "/api/trpc";
};

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getApiUrl(),
      transformer: superjson,
      headers() {
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
