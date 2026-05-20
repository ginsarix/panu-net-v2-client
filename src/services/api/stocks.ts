import { formatCdates } from '@/utils/formatting';

import { trpc } from '../trpc';

export const getStocks = async () => await trpc.stock.getStocks.query();

export const getStockMovements = async (stockKey: string) => {
  const stockMovements = await trpc.stock.getStockMovements.query({ stockKey });

  formatCdates(stockMovements.result);

  return stockMovements.result.map((c) => ({ ...c, stockKey }));
};

export const getServices = async () => await trpc.stock.getServices.query();
