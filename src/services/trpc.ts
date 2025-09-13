import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

import type { AppRouter } from '@/../../server/src/trpc/router';
import { API_CONFIG } from '@/config/api.ts';

import emitter from './service-bus';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_CONFIG.baseURL,
      fetch: async (input, init) => {
        if (!String(input).includes('company.getCreditCount')) emitter.emit('creditsMaybeChanged');

        return fetch(input, {
          ...(init as RequestInit),
          credentials: 'include',
        });
      },
    }),
  ],
});

export const cleanPayload = <T extends Record<string, unknown>>(
  payload: T,
  cleanZero: boolean = false,
) => {
  const compareFn = (v: unknown) => (!cleanZero ? v !== '' : v !== '' && v !== 0);
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => compareFn(v))) as Partial<T>;
};
