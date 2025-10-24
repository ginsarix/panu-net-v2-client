<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { useSelectedCompany } from '@/composables/useSelectedCompany';
import { useCreditorsStore } from '@/stores/creditors.ts';
import { useDisplayStore } from '@/stores/display';
import { useSnackbarStore } from '@/stores/snackbar';
import type { DataTableHeaders } from '@/types/data-table-headers';
import { formatCurrency } from '@/utils/formatting';

import GixTogglerMenu from '../GixTogglerMenu.vue';

const { mobile } = storeToRefs(useDisplayStore());

const creditorsStore = useCreditorsStore();
const { creditors } = storeToRefs(creditorsStore);

const { selectedCompany, loading: selectedCompanyLoading } = useSelectedCompany();

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loading = ref(false);

const loadCreditors = async () => {
  if (!selectedCompany.value) return;

  loading.value = true;
  try {
    await creditorsStore.loadCreditors();
  } catch (error) {
    console.error(error);

    if (error instanceof TRPCClientError) {
      snackbarError.value = true;
      snackbarText.value = error.message;
      snackbar.value = true;
    }
  } finally {
    loading.value = false;
  }
};

useCompanyPeriodWatcher(loadCreditors, true);

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Cari Kart Kodu', key: 'code', toggled: true, sortable: true },
  { title: 'Ünvan', key: 'name', toggled: true, sortable: true },
  { title: 'Bakiye', key: 'balance', toggled: true, sortable: true },
  { title: 'Döviz Türü', key: 'currency', toggled: true, sortable: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);
</script>

<template>
  <v-data-table
    :items="creditors"
    :loading="selectedCompanyLoading"
    class="rounded-lg elevation-0 border"
    no-data-text="Alacaklılar bulunamadı."
    loading-text="Alacaklılar yükleniyor..."
    items-per-page-text="Sayfa başı alacaklılar"
    :mobile="mobile.value"
    fixed-header
    :headers="includedDataTableHeaders"
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          Borçlular
        </v-toolbar-title>

        <GixTogglerMenu
          menu-activator-btn-text="Filtrele"
          menu-activator-btn-class="rounded-lg border me-5"
          menu-activator-btn-icon="mdi-filter-variant"
          v-model:toggle-items="dataTableHeaders"
        />
      </v-toolbar>
    </template>
    <template #[`item.balance`]="{ item }">
      {{ formatCurrency(item.balance) }}
    </template>
  </v-data-table>
</template>
