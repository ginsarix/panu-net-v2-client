import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getContracts } from '@/services/api/contracts';

type Contract = Awaited<ReturnType<typeof getContracts>>['payload'][number];

export const useContractsStore = defineStore('contracts', () => {
  const contracts = ref<Contract[]>([]);

  const loadContracts = async () => {
    const response = await getContracts();
    contracts.value = response.payload;
  };

  const addContractToList = (contract: Contract, addToStart = false) =>
    addToStart ? contracts.value.unshift(contract) : contracts.value.push(contract);

  const updateContractById = (id: string | number, data: Partial<Contract>) =>
    (contracts.value = contracts.value.map((c) => (c.id === id ? { ...c, ...data } : c)));

  const removeContractsById = (ids: Array<string | number>) => {
    const idSet = new Set(ids);

    contracts.value = contracts.value.filter((c) => !idSet.has(c.id));
  };

  return { contracts, loadContracts, addContractToList, updateContractById, removeContractsById };
});
