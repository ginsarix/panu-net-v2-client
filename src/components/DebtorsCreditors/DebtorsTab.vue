<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { useSelectedCompany } from '@/composables/useSelectedCompany';
import { useDebtorsStore } from '@/stores/debtors.ts';
import { useDisplayStore } from '@/stores/display.ts';
import { useSnackbarStore } from '@/stores/snackbar';
import type { DataTableHeaders } from '@/types/data-table-headers.ts';
import { formatCurrency } from '@/utils/formatting';

import ExportAsExcel from '../ExportAsExcel.vue';

const { mobile } = storeToRefs(useDisplayStore());

const debtorsStore = useDebtorsStore();
const { debtors } = storeToRefs(debtorsStore);

const { selectedCompany } = useSelectedCompany();

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loading = ref(false);

const loadDebtors = async () => {
  if (!selectedCompany.value) return;

  loading.value = true;
  try {
    await debtorsStore.loadDebtors();
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

useCompanyPeriodWatcher(loadDebtors, true);

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Cari Kart Kodu', key: 'code', toggled: true, sortable: true },
  { title: 'Ünvan', key: 'name', toggled: true, sortable: true },
  { title: 'Bakiye', key: 'balance', toggled: true, sortable: true },
  { title: 'Döviz Türü', key: 'currency', toggled: true, sortable: true },
  { title: '', key: 'actions', toggled: true, sortable: false },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);
</script>

<template>
  <v-data-table
    :items="debtors"
    :loading
    class="rounded-lg elevation-0 border"
    no-data-text="Borçlular bulunamadı."
    loading-text="Borçlular yükleniyor..."
    items-per-page-text="Sayfa başı borçlular"
    :mobile="mobile.value"
    fixed-header
    :headers="includedDataTableHeaders"
    hover
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          Borçlular
        </v-toolbar-title>

        <GixTogglerMenu
          menu-activator-btn-text="Kolonlar"
          menu-activator-btn-class="rounded-lg border me-3"
          menu-activator-btn-icon="mdi-filter-variant"
          v-model:toggle-items="dataTableHeaders"
        />
        <!-- remove debtorsOrCreditors from debtors so it matches the headers, also make sure it matches the order of the headers -->
        <ExportAsExcel
          class="me-5"
          :disabled="loading"
          :items="
            debtors.map((d) => ({
              code: d.code,
              name: d.name,
              balance: d.balance,
              currency: d.currency,
            }))
          "
          :filename="`borclular`"
          :headers="[
            includedDataTableHeaders
              .filter((header) => header.key !== 'actions')
              .map((header) => header.title),
          ]"
        />
      </v-toolbar>
    </template>
    <template #[`item.balance`]="{ item }">
      {{ formatCurrency(item.balance) }}
    </template>
  </v-data-table>
</template>
