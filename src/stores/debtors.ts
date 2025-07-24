import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getDebtors } from '@/services/api/debtors.ts';
import type { AccountCard } from '@/types/account-card.ts';

export const useDebtorsStore = defineStore('debtors', () => {
  const debtors = ref<AccountCard[]>([]);

  const loadDebtors = async (params: { companyCode: string; periodCode: string | number }) => {
    const result = await getDebtors(params);

    debtors.value = result.payload.result.map((ac) => ({
      code: ac.carikartkodu,
      debtorOrCreditor: ac.ba,
      name: ac.unvan,
      currency: ac.dovizturu,
      balance: Number(ac.bakiye),
    }));
  };

  return { debtors, loadDebtors };
});
