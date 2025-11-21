import { storeToRefs } from 'pinia';
import { watch } from 'vue';

import { useCompaniesStore } from '@/stores/companies';
import type { MaybePromise } from '@/types/maybe-promise';

export const useCompanyPeriodWatcher = (
  fn: (...args: unknown[]) => MaybePromise<unknown>,
  immediate = false,
) => {
  const companiesStore = useCompaniesStore();
  const { selectedCompanyId, selectedPeriodCode } = storeToRefs(companiesStore);

  const watchHandler = watch(
    [selectedCompanyId, selectedPeriodCode],
    async ([newSelectedCompanyId, newSelectedPeriodCode]) => {
      if (
        newSelectedCompanyId &&
        newSelectedPeriodCode !== null &&
        newSelectedPeriodCode !== undefined
      ) {
        try {
          await fn();
        } catch (error) {
          console.error('Error in company/period watcher callback', error);
          throw error;
        }
      }
    },
    { immediate },
  );

  return watchHandler;
};
