import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getStocks } from '@/services/api/stocks';
import type { StockCard } from '@/types/stock-card';

export const useStocksStore = defineStore('stocks', () => {
  const stocks = ref<StockCard[]>([]);

  const loadStocks = (params: { companyCode: string }) => {
    stocks.value = getStocks(params);
  };

  return { stocks };
});
