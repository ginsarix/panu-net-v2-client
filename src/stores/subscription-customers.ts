import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  type SubscriptionCustomerServerDataTableOptions,
  getSubscriptionCustomers,
} from '@/services/api/subscription-customers';
import type { SubscriptionCustomer } from '@/types/subscription-customer';

export const useSubscriptionCustomersStore = defineStore('subscriptionCustomers', () => {
  const subscriptionCustomers = ref<SubscriptionCustomer[]>([]);
  const totalSubscriptionsCount = ref(0);

  const loadSubscriptionCustomers = async (
    options?: SubscriptionCustomerServerDataTableOptions,
  ) => {
    const response = await getSubscriptionCustomers(options);

    subscriptionCustomers.value = response.subscriptionCustomers;
    totalSubscriptionsCount.value = response.total;
  };

  const addSubscriptionCustomerToList = (
    subscriptionCustomer: SubscriptionCustomer,
    addToStart = false,
  ) =>
    addToStart
      ? subscriptionCustomers.value.unshift(subscriptionCustomer)
      : subscriptionCustomers.value.push(subscriptionCustomer);

  const updateSubscriptionCustomerById = (
    id: string | number,
    data: Partial<SubscriptionCustomer>,
  ) =>
    (subscriptionCustomers.value = subscriptionCustomers.value.map((sc) =>
      sc.id === id ? { ...sc, ...data } : sc,
    ));

  const removeSubscriptionCustomersById = (ids: Array<string | number>) => {
    const idSet = new Set(ids);

    subscriptionCustomers.value = subscriptionCustomers.value.filter(
      (sc) => !idSet.has(sc.id ?? -1),
    );
  };

  return {
    subscriptionCustomers,
    loadSubscriptionCustomers,
    addSubscriptionCustomerToList,
    updateSubscriptionCustomerById,
    removeSubscriptionCustomersById,
  };
});
