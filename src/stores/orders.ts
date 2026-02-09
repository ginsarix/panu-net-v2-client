import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getOrders } from '@/services/api/orders';

type Orders = Awaited<ReturnType<typeof getOrders>>['orders']['result'];

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Orders>([]);

  const loadOrders = async () => {
    const response = await getOrders();
    orders.value = response.orders.result;
  };

  return { orders, loadOrders };
});
