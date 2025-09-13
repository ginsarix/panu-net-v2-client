import type { ServerDataTableOptions } from '@/types/server-data-table-options';

import { cleanPayload, trpc } from '../trpc';

export type SubscriptionSortKeys = 'creationDate' | 'startDate' | 'endDate' | 'subscriptionType';
export type SubscriptionServerDataTableOptions = ServerDataTableOptions<SubscriptionSortKeys>;

export const getSubscriptions = async (options?: SubscriptionServerDataTableOptions) =>
  await trpc.subscription.getSubscriptions.query(options ?? {});

export type CreateSubscriptionInput = Parameters<
  typeof trpc.subscription.createSubscription.mutate
>[0];

export const createSubscription = async (input: CreateSubscriptionInput) =>
  await trpc.subscription.createSubscription.mutate(input);

export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>;

export const patchSubscription = async (id: number, input: UpdateSubscriptionInput) => {
  const data = cleanPayload(input, true);
  return await trpc.subscription.updateSubscription.mutate({ id, data });
};

export const deleteSubscription = async (id: number) =>
  await trpc.subscription.deleteSubscription.mutate({ id });
