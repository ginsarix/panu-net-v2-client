import { trpc } from '../trpc';

export const getOrders = async () => await trpc.orders.getOrders.query();

export const forwardsOrdersToUsers = async (
  input: Parameters<typeof trpc.orders.forwardOrdersToUsers.mutate>['0'],
) => await trpc.orders.forwardOrdersToUsers.mutate(input);
