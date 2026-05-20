<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { getStockMovements } from '@/services/api/stocks';
import { useDisplayStore } from '@/stores/display.ts';
import { useSnackbarStore } from '@/stores/snackbar';
import { useStocksStore } from '@/stores/stocks';
import type { DataTableHeaders } from '@/types/data-table-headers';
import { formatToLocale } from '@/utils/formatting';

import ExportAsExcel from '../ExportAsExcel.vue';

const { mobile } = storeToRefs(useDisplayStore());

const stocksStore = useStocksStore();
const { stocks } = storeToRefs(stocksStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loading = ref(false);

const loadStocks = async () => {
  loading.value = true;
  try {
    await stocksStore.loadStocks();
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

useCompanyPeriodWatcher(loadStocks, true);

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Kod', key: 'stokkartkodu', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'aciklama', toggled: true, sortable: true },
  { title: 'Tür', key: 'stokkartturu', toggled: true, sortable: true },
  { title: 'Fiili Stok', key: 'fiili_stok', toggled: true, sortable: true },
  { title: 'Birim', key: 'birimadi', toggled: true, sortable: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

useColumnVisibility('stocks', dataTableHeaders);

const stockMovements = ref<Awaited<ReturnType<typeof getStockMovements>>>();

const stockMovementsLoadingStates = ref<Record<string, boolean>>({});

const loadStockMovements = async (stockKey: string) => {
  if (stockMovements.value?.some((c) => c.stockKey === stockKey)) return;

  stockMovementsLoadingStates.value[stockKey] = true;
  try {
    const newStockMovements = await getStockMovements(stockKey);
    stockMovements.value = [...(stockMovements.value ?? []), ...newStockMovements];
  } catch (error) {
    console.error(error);
    snackbarText.value = 'Hareketleri getirirken bir hata ile karşılaşıldı';
    snackbarError.value = true;
    snackbar.value = true;
  } finally {
    stockMovementsLoadingStates.value[stockKey] = false;
  }
};

const getStockMovementItems = (stockKey: string) =>
  stockMovements.value?.filter((c) => c.stockKey === stockKey);

const stockMovementsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Fiş No', key: 'fisno', toggled: true, sortable: true },
  { title: 'Tutar', key: 'tutari', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'aciklama', toggled: true, sortable: false },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);
</script>

<template>
  <v-data-table
    :items="stocks"
    :loading
    class="rounded-lg elevation-0 border"
    no-data-text="Stoklar bulunamadı."
    loading-text="Stoklar yükleniyor..."
    items-per-page-text="Sayfa başı stok"
    :mobile="mobile.value"
    fixed-header
    :headers="includedDataTableHeaders"
    show-expand
    item-value="stokkartkodu"
    hover
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          Stoklar
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
          :items="stocks"
          filename="stoklar"
          :headers="[includedDataTableHeaders.map((header) => header.title)]"
        />
      </v-toolbar>
    </template>
    <template #[`item.fiili_stok`]="{ item }">
      {{ formatToLocale(item.fiili_stok) }}
    </template>

    <template #[`item.data-table-expand`]="{ internalItem, isExpanded, toggleExpand }">
      <v-btn
        :append-icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        text="Hareketler"
        rounded="lg"
        class="text-none"
        color="medium-emphasis"
        size="small"
        variant="text"
        width="105"
        border
        slim
        @click="
          loadStockMovements(internalItem.raw._key);
          toggleExpand(internalItem);
        "
      />
    </template>

    <template #expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length" class="py-2">
          <v-sheet rounded="lg" border>
            <v-data-table
              :mobile="mobile.value"
              :headers="stockMovementsDataTableHeaders"
              :items="getStockMovementItems(item._key)"
              no-data-text="Hareket bulunamadı."
              :loading="stockMovementsLoadingStates[item._key]"
              loading-text="Hareketler yükleniyor..."
              hide-default-footer
            >
              <template #top>
                <v-card elevation="2" rounded="lg" class="rounded-b-0">
                  <v-card-title class="pa-3 pa-sm-4 border-b">
                    <div
                      class="d-flex align-center justify-space-between w-100 gap-2"
                      style="flex-wrap: nowrap"
                    >
                      <v-avatar color="teal-lighten-1" class="responsive-avatar flex-shrink-0">
                        <v-icon icon="mdi-swap-horizontal" color="white" />
                      </v-avatar>
                      <v-spacer />
                    </div>
                  </v-card-title>
                </v-card>
              </template>
              <template #[`item.tutari`]="{ item }">
                {{ formatToLocale(item.tutari) }}
              </template>
            </v-data-table>
          </v-sheet>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>
