<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, defineAsyncComponent, ref } from 'vue';

import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import { useColumnFilters } from '@/composables/useColumnFilters';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { useDisplayStore } from '@/stores/display.ts';
import { useSnackbarStore } from '@/stores/snackbar';
import { type Waybills, useWaybillsStore } from '@/stores/waybills';
import type { DataTableHeaders } from '@/types/data-table-headers';
import { uniqueBy } from '@/utils/array';
import { buildGroupedSumChartData } from '@/utils/chart';
import { formatToLocale } from '@/utils/formatting';

import ExportAsExcel from './ExportAsExcel.vue';

const GixChart = defineAsyncComponent(() => import('./GixChart.vue'));

const { mobile, xs } = storeToRefs(useDisplayStore());

const waybillsStore = useWaybillsStore();
const { waybills } = storeToRefs(waybillsStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loading = ref(false);

const loadWaybills = async () => {
  loading.value = true;
  try {
    await waybillsStore.loadWaybills();
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

type WaybillItem = Waybills[number];

const uniqueWaybills = computed(() => uniqueBy(waybills.value, 'fisno'));

const itemsByFisno = computed(() => {
  const map = new Map<string, WaybillItem[]>();
  for (const item of waybills.value) {
    const group = map.get(item.fisno);
    if (group) group.push(item);
    else map.set(item.fisno, [item]);
  }
  return map;
});

useCompanyPeriodWatcher(loadWaybills, true);

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Fiş No', key: 'fisno', toggled: true, sortable: true },
  { title: 'İrsaliye No', key: 'belgeno2', toggled: true, sortable: true },
  { title: 'Tür', key: 'turuack', toggled: true, sortable: true },
  { title: 'Cari Ünvan', key: 'cariunvan', toggled: true, sortable: true },
  { title: 'Döviz', key: 'doviz', toggled: true, sortable: true },
  { title: 'Ara Toplam', key: 'tutari', toggled: true, sortable: true },
  { title: 'KDV', key: 'kdvtutari', toggled: true, sortable: true },
  { title: 'İndirim', key: 'indirimtutari', toggled: true, sortable: true },
  { title: 'Genel Toplam', key: 'toplamtutar', toggled: true, sortable: true },
  { title: 'Faturalı', key: '__fatura', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

const itemsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Stok Kart Kodu', key: 'stokkartkodu', toggled: true, sortable: true },
  { title: 'Stok Açıklama', key: 'stokaciklama', toggled: true, sortable: false },
  { title: 'Miktar', key: 'miktar', toggled: true, sortable: true },
  { title: 'Birim', key: 'birim', toggled: true, sortable: true },
  { title: 'Ara Tutar', key: 'tutari', toggled: true, sortable: true },
  { title: 'KDV', key: 'kdvtutari', toggled: true, sortable: true },
  { title: 'İndirim', key: 'indirimtutari', toggled: true, sortable: true },
  { title: 'Genel Tutar', key: 'toplamtutar', toggled: true, sortable: true },
]);

const filtersTogglerItems = ref([
  { key: '1', title: 'Mal Alım', toggled: true },
  { key: '4', title: 'Konsinye Giriş', toggled: true },
  { key: '6', title: 'Mal Alım İade', toggled: true },
  { key: '9', title: 'Konsinye Giriş İade', toggled: true },
  { key: '12', title: 'Özel Giriş', toggled: true },
  { key: '15', title: 'Müstahsil İrsaliyesi', toggled: true },
  { key: '2', title: 'Perakende Satış', toggled: true },
  { key: '3', title: 'Toptan Satış', toggled: true },
  { key: '5', title: 'Konsinye Çıkış', toggled: true },
  { key: '7', title: 'Perakende Satış İade', toggled: true },
  { key: '8', title: 'Toptan Satış İade', toggled: true },
  { key: '11', title: 'Konsinye Çıkış İade', toggled: true },
  { key: '13', title: 'Özel Çıkış', toggled: true },
]);

const getToggledKeys = (items: { key: string; toggled: boolean }[]) =>
  items.filter((item) => item.toggled).map((item) => item.key);

const showWaybillChart = ref(false);

const invoicedFilter = ref<boolean | null>(null);
const invoicedFilterOptions = ref([
  { title: 'Hepsi', value: null },
  { title: 'Sadece Faturalı', value: true },
  { title: 'Sadece Faturasız', value: false },
]);

const filteredWaybills = computed(() => {
  const toggledKeys = getToggledKeys(filtersTogglerItems.value);

  const invoicePredicate = (w: WaybillItem) => w.__fatura === (invoicedFilter.value ? 'F' : '-');

  return uniqueWaybills.value.filter(
    (w) =>
      toggledKeys.includes(w.turu) &&
      /** mildly confusing at first glance -> */ (invoicedFilter.value === null ||
        invoicePredicate(w)),
  );
});

// toggle filtered raw data for chart
const filteredWaybillsRaw = computed(() => {
  const toggledKeys = getToggledKeys(filtersTogglerItems.value);
  return waybills.value.filter((w) => toggledKeys.includes(w.turu));
});

const waybillChartData = computed(() => {
  if (!filteredWaybillsRaw.value.length) {
    return { legendData: [], seriesData: [] };
  }

  return buildGroupedSumChartData<{
    turuack?: string;
    toplamtutar?: string | number;
  }>(
    filteredWaybillsRaw.value,
    (w) => w.turuack,
    (w) => w.toplamtutar,
  );
});

useColumnFilters('waybills-standalone', filtersTogglerItems);
useColumnVisibility('waybills-standalone', dataTableHeaders);
</script>

<template>
  <v-data-table
    :items="filteredWaybills"
    :loading
    class="rounded-lg elevation-0 border"
    no-data-text="İrsaliye bulunamadı."
    loading-text="İrsaliyeler yükleniyor..."
    items-per-page-text="Sayfa başı irsaliye"
    :mobile="mobile.value"
    fixed-header
    :headers="includedDataTableHeaders"
    hover
    show-expand
    item-value="fisno"
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          İrsaliyeler
        </v-toolbar-title>

        <v-select
          label="Faturalı"
          rounded="lg"
          density="compact"
          variant="outlined"
          min-width="150px"
          max-width="250px"
          class="mt-5 mr-5"
          v-model="invoicedFilter"
          :items="invoicedFilterOptions"
        />

        <GixTogglerMenu
          menu-activator-btn-text="Türler"
          menu-activator-btn-class="rounded-lg border"
          menu-activator-btn-icon="mdi-filter"
          v-model:toggle-items="filtersTogglerItems"
        />

        <GixTogglerMenu
          class="ms-3"
          menu-activator-btn-text="Kolonlar"
          menu-activator-btn-class="rounded-lg border me-3"
          menu-activator-btn-icon="mdi-filter-variant"
          v-model:toggle-items="dataTableHeaders"
        />

        <v-btn
          :prepend-icon="!xs.value ? 'mdi-chart-bar' : undefined"
          :icon="xs.value ? 'mdi-chart-bar' : undefined"
          variant="text"
          rounded="lg"
          class="mr-3 text-none"
          :text="!xs.value ? 'Tür Bazlı Grafik' : undefined"
          :append-icon="showWaybillChart ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          :size="xs.value ? 'small' : undefined"
          border
          @click="showWaybillChart = !showWaybillChart"
        />

        <ExportAsExcel
          class="me-5"
          :disabled="loading"
          :items="waybills"
          filename="irsaliyeler"
          :headers="[includedDataTableHeaders.map((header) => header.title)]"
        />
      </v-toolbar>
      <v-expand-transition v-show="showWaybillChart">
        <GixChart
          seriesName="Toplam Tutar"
          :seriesData="waybillChartData.seriesData"
          :data-formatter="formatToLocale"
          currency="TL"
          height="55vh"
        />
      </v-expand-transition>
    </template>
    <template #[`item.tutari`]="{ item: { fisno } }">
      {{
        formatToLocale(itemsByFisno.get(fisno)?.reduce((sum, w) => sum + Number(w.tutari), 0) ?? 0)
      }}
    </template>
    <template #[`item.kdvtutari`]="{ item: { fisno } }">
      {{
        formatToLocale(
          itemsByFisno.get(fisno)?.reduce((sum, w) => sum + Number(w.kdvtutari), 0) ?? 0,
        )
      }}
    </template>
    <template #[`item.indirimtutari`]="{ item: { fisno } }">
      {{
        formatToLocale(
          itemsByFisno.get(fisno)?.reduce((sum, w) => sum + Number(w.indirimtutari), 0) ?? 0,
        )
      }}
    </template>
    <template #[`item.toplamtutar`]="{ item: { fisno } }">
      {{
        formatToLocale(
          itemsByFisno.get(fisno)?.reduce((sum, w) => sum + Number(w.toplamtutar), 0) ?? 0,
        )
      }}
    </template>
    <template #[`item.__fatura`]="{ item: { __fatura } }">
      <v-chip :color="__fatura === 'F' ? 'primary' : 'error'">{{
        __fatura === 'F' ? 'Evet' : 'Hayır'
      }}</v-chip>
    </template>

    <template #[`item.data-table-expand`]="{ internalItem, isExpanded, toggleExpand }">
      <v-btn
        :append-icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        text="Kalemler"
        rounded="lg"
        class="text-none"
        color="medium-emphasis"
        size="small"
        variant="text"
        width="105"
        border
        slim
        @click="toggleExpand(internalItem)"
      />
    </template>

    <template #expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length" class="py-2">
          <v-sheet rounded="lg" border>
            <v-data-table
              :mobile="mobile.value"
              :headers="itemsDataTableHeaders"
              :items="itemsByFisno.get(item.fisno)"
              hide-default-footer
            >
              <template #[`item.miktar`]>
                {{ Number(item.miktar).toFixed(2) }}
              </template>
              <template #[`item.tutari`]="{ item }">
                {{ formatToLocale(item.tutari) }}
              </template>
              <template #[`item.kdvtutari`]="{ item }">
                {{ formatToLocale(item.kdvtutari) }}
              </template>
              <template #[`item.indirimtutari`]="{ item }">
                {{ formatToLocale(item.indirimtutari) }}
              </template>
              <template #[`item.toplamtutar`]="{ item }">
                {{ formatToLocale(item.toplamtutar) }}
              </template>
            </v-data-table>
          </v-sheet>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<style>
.v-toolbar__content {
  overflow: auto !important;
  overflow-y: hidden !important;
}
</style>
