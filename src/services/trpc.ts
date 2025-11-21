import {
  createTRPCProxyClient,
  httpBatchLink,
  httpLink,
  httpSubscriptionLink,
  isNonJsonSerializable,
  splitLink,
} from '@trpc/client';
import superjson from 'superjson';

import type { AppRouter } from '@/../../server/src/trpc/router';
import { API_CONFIG } from '@/config/api.ts';

interface DataTransformer {
  serialize: (object: unknown) => unknown;
  deserialize: (object: unknown) => unknown;
}

export class FormDataTransformer implements DataTransformer {
  serialize(object: unknown) {
    if (!(object instanceof FormData)) {
      throw new Error('Expected FormData');
    }

    return object;
  }

  deserialize(object: unknown) {
    return object as JSON;
  }
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => isNonJsonSerializable(op.input),
      true: httpLink({
        url: API_CONFIG.baseURL,
        transformer: new FormDataTransformer(),
        fetch: async (input, init) => {
          return fetch(input, {
            ...(init as RequestInit),
            credentials: 'include',
          });
        },
      }),
      false: splitLink({
        condition: (op) => op.type === 'subscription',
        true: httpSubscriptionLink({
          url: API_CONFIG.baseURL,
          transformer: superjson,
          eventSourceOptions: {
            withCredentials: true,
          },
        }),
        false: httpBatchLink({
          url: API_CONFIG.baseURL,
          transformer: superjson,
          fetch: async (input, init) => {
            return fetch(input, {
              ...(init as RequestInit),
              credentials: 'include',
            });
          },
        }),
      }),
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
