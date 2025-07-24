import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

import type { AppRouter } from '@/../../server/src/trpc/router';
import { API_CONFIG } from '@/config/api.ts';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_CONFIG.baseURL,
      fetch: async (input, init) => {
        return fetch(input, {
          ...init,
          credentials: 'include',
        });
      },
    }),
  ],
});

export const cleanPayload = <T extends Record<string, unknown>>(payload: T) => {
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== ''));
};
