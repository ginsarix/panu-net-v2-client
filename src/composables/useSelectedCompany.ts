import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';

import emitter from '@/services/service-bus';
import { useAsyncGateStore } from '@/stores/async-gate';
import { useCompaniesStore } from '@/stores/companies';
import type { Company } from '@/types/company';

export const useSelectedCompany = () => {
  const asyncGate = useAsyncGateStore();

  const companiesStore = useCompaniesStore();
  const { selectedCompanyId, selectedCompanyIdLoaded } = storeToRefs(companiesStore);

  const selectedCompany = ref<Company | null>(null);
  const loading = ref(false);

  watch(
    [selectedCompanyId, selectedCompanyIdLoaded],
    async ([, loaded]) => {
      if (!loaded) return;
      const instance = companiesStore.getSelectedCompanyInstance();

      if (!instance) {
        await asyncGate.promise;
        loading.value = false;

        emitter.emit('companyNotSelected');
        return;
      }

      selectedCompany.value = instance;
      loading.value = false;
    },
    { immediate: true },
  );

  return { selectedCompany, loading };
};
