import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import {
  type CompanyServerDataTableOptions,
  getCompanies,
  getCreditCount,
  getPeriods,
  getSelectedCompany,
} from '@/services/api/companies.ts';
import emitter from '@/services/service-bus';
import type { Company } from '@/types/company.ts';
import type { Period } from '@/types/period';

export const useCompaniesStore = defineStore('companies', () => {
  const companies = ref<Company[]>([]);
  const periods = ref<Period[]>([]);
  const selectedPeriodCode = ref(0);

  const totalCompaniesCount = ref(0);

  const selectedCompanyId = ref<number | null>(null);
  const selectedCompanyIdLoaded = ref(false);

  const creditCount = ref<number | null>(null);
  const creditCountLoading = ref(false);
  emitter.on('creditsMaybeChanged', async () => {
    if (selectedCompanyId.value) {
      creditCountLoading.value = true;
      creditCount.value = await getCreditCount();
      creditCountLoading.value = false;
    }
  });

  watch(selectedCompanyId, async (newValue) => {
    if (!newValue) return;
    const instance = getSelectedCompanyInstance();
    const companyCode = instance?.code;

    if (companyCode === undefined) return;

    periods.value = (await getPeriods(companyCode)).map((p) => ({
      code: p.donemkodu,
      startDate: p.baslangic,
      endDate: p.bitis,
    }));
  });

  const getSelectedCompanyInstance = () =>
    companies.value.find((c) => c.id === selectedCompanyId.value);
  const loadSelectedCompanyId = async () => {
    try {
      selectedCompanyId.value = (await getSelectedCompany()).id ?? null;
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

  const addCompanyToList = (company: Company, addToStart = false) =>
    (companies.value = addToStart ? [company, ...companies.value] : [...companies.value, company]);

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
    creditCount,
    creditCountLoading,
    selectedCompanyId,
    selectedCompanyIdLoaded,
    periods,
    selectedPeriodCode,
    loadCompanies,
    addCompanyToList,
    updateCompanyById,
    removeCompaniesById,
    getSelectedCompanyInstance,
    loadSelectedCompanyId,
  };
});
