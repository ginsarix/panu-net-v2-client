import { defineStore } from 'pinia';
import { onUnmounted, ref, watch } from 'vue';

import {
  type CompanyServerDataTableOptions,
  getCompanies,
  getPeriods,
  getSelectedCompany,
  getSelectedPeriod,
} from '@/services/api/companies.ts';
import { trpc } from '@/services/trpc.ts';
import type { Company } from '@/types/company.ts';
import type { Period } from '@/types/period';

export const useCompaniesStore = defineStore('companies', () => {
  const companies = ref<Company[]>([]);
  const periods = ref<Period[]>([]);
  const periodsLoading = ref(false);
  const selectedPeriodCode = ref(0);

  const totalCompaniesCount = ref(0);

  const selectedCompanyId = ref<number | null>(null);
  const selectedCompanyIdLoaded = ref(false);

  const creditCount = ref<number | null>(null);
  const creditCountLoading = ref(false);
  let subscription: { unsubscribe: () => void } | null = null;

  const connectCreditCountSSE = () => {
    if (!selectedCompanyId.value) return;

    // Close existing subscription if any
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }

    creditCountLoading.value = true;

    // Subscribe to the tRPC subscription
    subscription = trpc.company.getCreditCount.subscribe(undefined, {
      onData: (d) => {
        creditCount.value = d.data;
        creditCountLoading.value = false;
      },
      onError: (error) => {
        console.error('Credit count subscription error:', error);
        creditCountLoading.value = false;
      },
    });
  };

  const disconnectCreditCountSSE = () => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
    creditCount.value = null;
    creditCountLoading.value = false;
  };

  watch(selectedCompanyId, async (newValue, oldValue) => {
    // Disconnect SSE when company changes or is cleared
    if (oldValue !== null || newValue === null) {
      disconnectCreditCountSSE();
    }

    if (!newValue) return;

    // Connect SSE for new company
    connectCreditCountSSE();

    const instance = getSelectedCompanyInstance();
    const companyCode = instance?.code;

    if (companyCode === undefined) return;

    periods.value = [];

    periodsLoading.value = true;
    try {
      periods.value = (await getPeriods(companyCode)).map((p) => ({
        code: p.donemkodu,
        startDate: p.baslangic,
        endDate: p.bitis,
      }));

      // after selected company change selected period code in the session is set to 0 by the backend.
      selectedPeriodCode.value = 0;
    } catch (error) {
      console.error(error);
    } finally {
      periodsLoading.value = false;
    }
  });

  const getSelectedCompanyInstance = () =>
    companies.value.find((c) => c.id === selectedCompanyId.value);

  const loadSelectedCompanyId = async () => {
    try {
      selectedCompanyId.value = ((await getSelectedCompany()).id as number) ?? null;
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
    addToStart ? companies.value.unshift(company) : companies.value.push(company);

  const updateCompanyById = (id: string | number, data: Partial<Company>) => {
    companies.value = companies.value.map((c) => (c.id === id ? { ...c, ...data } : c));
  };

  const removeCompaniesById = (ids: Array<string | number>) => {
    const idSet = new Set(ids);
    companies.value = companies.value.filter((c) => !idSet.has(c.id ?? -1));
  };

  const loadSelectedPeriodCode = async () => {
    try {
      const result = await getSelectedPeriod();
      selectedPeriodCode.value = (result.code as number) ?? 0;
    } catch {
      selectedPeriodCode.value = 0;
    }
  };

  onUnmounted(() => {
    disconnectCreditCountSSE();
  });

  return {
    companies,
    totalCompaniesCount,
    creditCount,
    creditCountLoading,
    selectedCompanyId,
    selectedCompanyIdLoaded,
    periods,
    periodsLoading,
    selectedPeriodCode,
    loadCompanies,
    addCompanyToList,
    updateCompanyById,
    removeCompaniesById,
    getSelectedCompanyInstance,
    loadSelectedCompanyId,
    loadSelectedPeriodCode,
    connectCreditCountSSE,
    disconnectCreditCountSSE,
  };
});
