import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client.
 * - staleTime: data stays fresh for 3 min before background refetch
 * - gcTime (cacheTime): keep unused data in memory for 10 min
 * - retry: only retry once to avoid hammering the server when offline
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
