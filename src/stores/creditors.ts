import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getCreditors } from '@/services/api/creditors';
import type { AccountCard } from '@/types/account-card.ts';

export const useCreditorsStore = defineStore('creditors', () => {
  const creditors = ref<AccountCard[]>([]);

  const loadCreditors = async (params: { companyCode: string; periodCode: string | number }) => {
    const result = await getCreditors(params);

    creditors.value = result.payload.result.map((ac) => ({
      code: ac.carikartkodu,
      debtorOrCreditor: ac.ba,
      name: ac.unvan,
      currency: ac.dovizturu,
      balance: Number(ac.bakiye),
    }));
  };

  return { creditors, loadCreditors };
});
