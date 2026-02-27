import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getWaybills } from '@/services/api/waybills';

export type Waybills = Awaited<ReturnType<typeof getWaybills>>['waybills']['result'];
export const useWaybillsStore = defineStore('waybills', () => {
  const waybills = ref<Waybills>([]);

  const loadWaybills = async () => {
    const response = await getWaybills();
    waybills.value = response.waybills.result;
  };

  return { waybills, loadWaybills };
});
