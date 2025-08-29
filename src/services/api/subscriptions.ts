import type { ServerDataTableOptions } from '@/types/server-data-table-options';

import { trpc } from '../trpc';

export type SubscriptionSortKeys = 'creationDate' | 'startDate' | 'endDate' | 'subscriptionType';
export type SubscriptionServerDataTableOptions = ServerDataTableOptions<SubscriptionSortKeys>;

export const getSubscriptions = async (options?: SubscriptionServerDataTableOptions) => {
  return await trpc.subscription.getSubscriptions.query(options ?? {});
};

export type CreateSubscriptionInput = Parameters<
  typeof trpc.subscription.createSubscription.mutate
>[0];

export const createSubscription = async (input: CreateSubscriptionInput) => {
  return await trpc.subscription.createSubscription.mutate(input);
};
