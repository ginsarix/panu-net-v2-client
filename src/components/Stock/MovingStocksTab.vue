<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useSelectedCompany } from '@/composables/useSelectedCompany';
import { useAsyncGateStore } from '@/stores/async-gate';
import { useCompaniesStore } from '@/stores/companies';
import { useDisplayStore } from '@/stores/display';
import { useSnackbarStore } from '@/stores/snackbar';
import { useStocksStore } from '@/stores/stocks';
import type { DataTableHeaders } from '@/types/data-table-headers';

import GixTogglerMenu from '../GixTogglerMenu.vue';

const asyncGateStore = useAsyncGateStore();

const { mobile } = storeToRefs(useDisplayStore());

const stocksStore = useStocksStore();
const { stocks } = storeToRefs(stocksStore);

const companiesStore = useCompaniesStore();
const { selectedPeriodCode } = storeToRefs(companiesStore);

const { selectedCompany, loading } = useSelectedCompany();

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

watch(
  [selectedCompany, selectedPeriodCode],
  async ([newSelectedCompany, newSelectedPeriod]) => {
    if (newSelectedCompany || newSelectedPeriod) {
      await asyncGateStore.promise;
      await loadStocks();
    }
  },
  { immediate: true },
);

const loadStocks = async () => {
  if (!selectedCompany.value) return;

  try {
  } catch (error) {
    console.error(error);
    if (error instanceof TRPCClientError) {
      snackbarError.value = true;
      snackbarText.value = error.message;
      snackbar.value = true;
    }
  }
};

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Stok Kodu', key: 'code', toggled: true, sortable: true },
  { title: 'Ad', key: 'name', toggled: true, sortable: true },
  { title: 'Birim Adı', key: 'balance', toggled: true, sortable: true },
  { title: '', key: 'actions', toggled: true, sortable: false },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);
</script>

<template>
  <v-data-table
    :items="stocks"
    :loading="loading"
    class="rounded-lg elevation-0 border"
    no-data-text="Stoklar bulunamadı."
    loading-text="Stoklar yükleniyor..."
    items-per-page="Sayfa başı stoklar"
    :mobile="mobile.value"
    fixed-header
    :headers="includedDataTableHeaders"
    hover
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          Hareket Gören Stoklar
        </v-toolbar-title>

        <GixTogglerMenu
          menu-activator-btn-text="Filtrele"
          menu-activator-btn-class="rounded-lg border me-5"
          menu-activator-btn-icon="mdi-filter-variant"
          v-model:toggle-items="dataTableHeaders"
        />
      </v-toolbar>
    </template>
  </v-data-table>
</template>
