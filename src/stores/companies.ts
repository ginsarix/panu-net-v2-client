import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  type CompanyServerDataTableOptions,
  getCompanies,
  getSelectedCompany,
} from '@/services/api/companies.ts';
import type { Company } from '@/types/company.ts';

export const useCompaniesStore = defineStore('companies', () => {
  const companies = ref<Company[]>([]);
  const totalCompaniesCount = ref(0);

  const selectedCompanyId = ref<number | null>(null);
  const selectedCompanyIdLoaded = ref(false);

  const getSelectedCompanyInstance = () =>
    companies.value.find((c) => c.id === selectedCompanyId.value);
  const loadSelectedCompanyId = async () => {
    try {
      selectedCompanyId.value = Number((await getSelectedCompany()).id) ?? null;
    } catch {
      selectedCompanyId.value = null;
    } finally {
      selectedCompanyIdLoaded.value = true;
    }
  };
  const loadCompanies = async (params?: CompanyServerDataTableOptions) => {
    const result = await getCompanies(params);

    companies.value = result.companies;
    totalCompaniesCount.value = result.total;
  };

  const addCompanyToList = (company: Company, addToStart = false) => {
    if (addToStart) {
      companies.value = [company, ...companies.value];
      return;
    }

    companies.value = [...companies.value, company];
  };

  const updateCompanyById = (id: string | number, data: Partial<Company>) => {
    companies.value = companies.value.map((c) => (c.id === id ? { ...c, ...data } : c));
  };

  const removeCompaniesById = (ids: Array<string | number>) => {
    const idSet = new Set(ids);
    companies.value = companies.value.filter((c) => !idSet.has(c.id ?? -1));
  };

  return {
    companies,
    totalCompaniesCount,
    selectedCompanyId,
    selectedCompanyIdLoaded,
    loadCompanies,
    addCompanyToList,
    updateCompanyById,
    removeCompaniesById,
    getSelectedCompanyInstance,
    loadSelectedCompanyId,
  };
});
