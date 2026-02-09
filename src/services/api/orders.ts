import { trpc } from '../trpc';

export const getOrders = async () => await trpc.orders.getOrders.query();
