import { createContext, useContext, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ApiClient } from "./ApiClient";

const ApiContext = createContext<ApiClient | null>(null);

interface ApiProviderProps {
  client: ApiClient;
  children: ReactNode;
}

/** Provides the ApiClient + a QueryClient to the whole tree. */
export function ApiProvider({ client, children }: ApiProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ApiContext.Provider value={client}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiContext.Provider>
  );
}

export function useApi(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) throw new Error("useApi must be used inside <ApiProvider>");
  return client;
}
