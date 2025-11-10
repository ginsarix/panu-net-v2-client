import type { ServerDataTableOptions } from '@/types/server-data-table-options';

import { cleanPayload, trpc } from '../trpc';

export type SubscriptionCustomerSortKeys =
  | 'creationDate'
  | 'customerCode'
  | 'title'
  | 'status'
  | 'manager'
  | 'email';
export type SubscriptionCustomerServerDataTableOptions =
  ServerDataTableOptions<SubscriptionCustomerSortKeys>;

export const getSubscriptionCustomers = async (
  options?: SubscriptionCustomerServerDataTableOptions,
) => await trpc.subscriptionCustomer.getSubscriptionCustomers.query(options ?? {});

export type CreateSubscriptionCustomerInput = Parameters<
  typeof trpc.subscriptionCustomer.createSubscriptionCustomer.mutate
>[0];

export const createSubscriptionCustomer = async (input: CreateSubscriptionCustomerInput) =>
  await trpc.subscriptionCustomer.createSubscriptionCustomer.mutate(input);

export type UpdateSubscriptionCustomerInput = Partial<CreateSubscriptionCustomerInput>;

export const patchSubscriptionCustomer = async (
  id: number,
  input: UpdateSubscriptionCustomerInput,
) => {
  const data = cleanPayload(input, true);
  return await trpc.subscriptionCustomer.updateSubscriptionCustomer.mutate({ id, data });
};

export const deleteSubscriptionCustomer = async (id: number) =>
  await trpc.subscriptionCustomer.deleteSubscriptionCustomer.mutate({ id });

export type TestNotificationInput = Parameters<
  typeof trpc.subscriptionCustomer.testNotification.mutate
>[0];

export const testNotification = async (input: TestNotificationInput) =>
  await trpc.subscriptionCustomer.testNotification.mutate({
    email: input.email,
    phone: input.phone,
    remindExpiryWithEmail: input.remindExpiryWithEmail,
    remindExpiryWithSms: input.remindExpiryWithSms,
  });
