import { trpc } from '../trpc';

export const getStocks = async () => await trpc.stock.getStocks.query();
export const getServices = async () => await trpc.stock.getServices.query();
