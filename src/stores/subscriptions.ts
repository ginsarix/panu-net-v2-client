import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  type SubscriptionServerDataTableOptions,
  getSubscriptions,
} from '@/services/api/subscriptions';
import type { Subscription } from '@/types/subscription';

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const subscriptions = ref<Subscription[]>([]);
  const totalSubscriptionsCount = ref(0);

  const loadSubscriptions = async (params?: SubscriptionServerDataTableOptions) => {
    const response = await getSubscriptions(params);

    subscriptions.value = response.subscriptions;
    totalSubscriptionsCount.value = response.total;
  };

  const addSubscriptionToList = (subscription: Subscription, addToStart = false) =>
    addToStart ? subscriptions.value.unshift(subscription) : subscriptions.value.push(subscription);

  const updateSubscriptionById = (id: string | number, data: Partial<Subscription>) =>
    (subscriptions.value = subscriptions.value.map((s) => (s.id === id ? { ...s, ...data } : s)));

  const removeSubscriptionsById = (ids: Array<string | number>) => {
    const idSet = new Set(ids);

    subscriptions.value = subscriptions.value.filter((s) => !idSet.has(s.id ?? -1));
  };

  return {
    subscriptions,
    totalSubscriptionsCount,
    loadSubscriptions,
    addSubscriptionToList,
    updateSubscriptionById,
    removeSubscriptionsById,
  };
});
