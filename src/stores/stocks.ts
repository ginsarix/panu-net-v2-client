import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getServices, getStocks } from '@/services/api/stocks';

type Stock = Awaited<ReturnType<typeof getStocks>>['payload']['result'];
type Service = Awaited<ReturnType<typeof getServices>>['payload']['result'];

export const useStocksStore = defineStore('stocks', () => {
  const stocks = ref<Stock>([]);
  const services = ref<Service>([]);

  const loadStocks = async () => {
    const response = await getStocks();
    stocks.value = response.payload.result;
  };

  const loadServices = async () => {
    const response = await getServices();
    services.value = response.payload.result;
  };

  return { stocks, services, loadStocks, loadServices };
});
