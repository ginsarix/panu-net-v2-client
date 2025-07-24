<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useSelectedCompany } from '@/composables/useSelectedCompany';
import { useCreditorsStore } from '@/stores/creditors.ts';
import { useDisplayStore } from '@/stores/display';
import { useSnackbarStore } from '@/stores/snackbar';
import type { DataTableHeaders } from '@/types/data-table-headers';

import DataTableInfo from '../DataTableInfo.vue';
import GixTogglerMenu from '../GixTogglerMenu.vue';

const { mobile } = storeToRefs(useDisplayStore());

const creditorsStore = useCreditorsStore();
const { creditors } = storeToRefs(creditorsStore);

const { selectedCompany, loading } = useSelectedCompany();

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

watch(selectedCompany, async (newValue) => {
  if (newValue) await loadCreditors();
});

const loadCreditors = async () => {
  if (!selectedCompany.value) return;

  try {
    await creditorsStore.loadCreditors({
      companyCode: selectedCompany.value.code,
      periodCode: selectedCompany.value.period,
    });
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
    :loading="loading"
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
          menu-activator-btn-class="rounded-lg border me-3"
          menu-activator-btn-icon="mdi-filter-variant"
          v-model:toggle-items="dataTableHeaders"
        />

        <DataTableInfo class="me-5" />
      </v-toolbar>
    </template>
  </v-data-table>
</template>
