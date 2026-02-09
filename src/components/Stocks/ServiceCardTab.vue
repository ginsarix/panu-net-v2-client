<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { useDisplayStore } from '@/stores/display.ts';
import { useSnackbarStore } from '@/stores/snackbar';
import { useStocksStore } from '@/stores/stocks';
import type { DataTableHeaders } from '@/types/data-table-headers';
import { formatToLocale } from '@/utils/formatting';

import ExportAsExcel from '../ExportAsExcel.vue';

const { mobile } = storeToRefs(useDisplayStore());

const stocksStore = useStocksStore();
const { services } = storeToRefs(stocksStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loading = ref(false);

const loadServices = async () => {
  loading.value = true;
  try {
    await stocksStore.loadServices();
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

useCompanyPeriodWatcher(loadServices, true);

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Kod', key: 'hizmetkartkodu', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'aciklama', toggled: true, sortable: true },
  { title: 'Tür', key: 'hizmetkartturuack', toggled: true, sortable: true },
  { title: 'Miktar', key: 'miktar', toggled: true, sortable: true },
  { title: 'Birim', key: 'birimadi', toggled: true, sortable: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

useColumnVisibility('services', dataTableHeaders);
</script>

<template>
  <v-data-table
    :items="services"
    :loading
    class="rounded-lg elevation-0 border"
    no-data-text="Hizmetler bulunamadı."
    loading-text="Hizmetler yükleniyor..."
    items-per-page-text="Sayfa başı Hizmet"
    :mobile="mobile.value"
    fixed-header
    :headers="includedDataTableHeaders"
    hover
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          Hizmetler
        </v-toolbar-title>

        <GixTogglerMenu
          menu-activator-btn-text="Kolonlar"
          menu-activator-btn-class="rounded-lg border me-3"
          menu-activator-btn-icon="mdi-filter-variant"
          v-model:toggle-items="dataTableHeaders"
        />

        <ExportAsExcel
          class="me-5"
          :disabled="loading"
          :items="services"
          filename="hizmetler"
          :headers="[includedDataTableHeaders.map((header) => header.title)]"
        />
      </v-toolbar>
    </template>
    <template #[`item.miktar`]="{ item }"> {{ formatToLocale(item.miktar) }} </template>
  </v-data-table>
</template>
