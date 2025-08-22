import { trpc } from '../trpc';

export const getStocks = async (params: { companyCode: string }) => {
  return await trpc.stock.getStock.query(params);
};
