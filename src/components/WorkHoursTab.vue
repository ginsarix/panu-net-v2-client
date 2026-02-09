<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { useDisplayStore } from '@/stores/display.ts';
import { useSnackbarStore } from '@/stores/snackbar';
import { useWorkHoursStore } from '@/stores/work-hours';
import type { DataTableHeaders } from '@/types/data-table-headers';
import { buildGroupedSumChartData } from '@/utils/chart';
import { formatToLocale } from '@/utils/formatting';

import ExportAsExcel from './ExportAsExcel.vue';
import GixBarChart from './GixBarChart.vue';

const { mobile, xs } = storeToRefs(useDisplayStore());

const workHoursStore = useWorkHoursStore();
const { workHours } = storeToRefs(workHoursStore);

const workHoursChartData = computed(() => {
  const summedWorkHours = workHours.value.map((wh) => ({
    name: wh.personeladisoyadi,
    totalHours:
      Number(wh.normalmesaisaat) +
      Number(wh.toplamfazlamesaisaat) +
      Number(wh.gecemesaisisaat) +
      Number(wh.haftasonumesaisisaat),
  }));

  const data = buildGroupedSumChartData<{
    name?: string;
    totalHours?: string | number;
  }>(
    summedWorkHours,
    (c) => c.name,
    (c) => c.totalHours,
  ).seriesData;

  return { axisData: data.map((s) => s.name), barSeriesData: data.map((s) => Number(s.value)) };
});

const regularWorkHoursChartData = computed(() => {
  const summedRegularWorkHours = workHours.value.map((rwh) => ({
    name: rwh.personeladisoyadi,
    totalHours: Number(rwh.normalmesaisaat),
  }));

  const data = buildGroupedSumChartData<{
    name?: string;
    totalHours?: string | number;
  }>(
    summedRegularWorkHours,
    (c) => c.name,
    (c) => c.totalHours,
  ).seriesData;

  return { axisData: data.map((s) => s.name), barSeriesData: data.map((s) => Number(s.value)) };
});

const extraWorkHoursChartData = computed(() => {
  const summedExtraWorkHours = workHours.value.map((ewh) => ({
    name: ewh.personeladisoyadi,
    totalHours:
      Number(ewh.toplamfazlamesaisaat) +
      Number(ewh.gecemesaisisaat) +
      Number(ewh.haftasonumesaisisaat),
  }));

  const data = buildGroupedSumChartData<{
    name?: string;
    totalHours?: string | number;
  }>(
    summedExtraWorkHours,
    (c) => c.name,
    (c) => c.totalHours,
  ).seriesData;

  return { axisData: data.map((s) => s.name), barSeriesData: data.map((s) => Number(s.value)) };
});

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loading = ref(false);

const loadWorkHours = async () => {
  loading.value = true;
  try {
    await workHoursStore.loadWorkHours();
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

useCompanyPeriodWatcher(loadWorkHours, true);

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Personel Sicil No', key: 'personelsicilno', toggled: true, sortable: true },
  { title: 'Personel Adı Soyadı', key: 'personeladisoyadi', toggled: true, sortable: true },
  { title: 'Normal Mesai Saati', key: 'normalmesaisaat', toggled: true, sortable: true },
  { title: 'Fazla Mesai Saati', key: 'toplamfazlamesaisaat', toggled: true, sortable: true },
  { title: 'Gece Mesai Saati', key: 'gecemesaisisaat', toggled: true, sortable: true },
  { title: 'Hafta Sonu Mesai Saati', key: 'haftasonumesaisisaat', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

useColumnVisibility('work-hours', dataTableHeaders);
</script>

<template>
  <v-data-table
    :items="workHours"
    :loading
    class="rounded-lg elevation-0 border"
    no-data-text="Mesai bulunamadı."
    loading-text="Mesailer yükleniyor..."
    items-per-page-text="Sayfa başı mesai"
    :mobile="mobile.value"
    fixed-header
    :headers="includedDataTableHeaders"
    hover
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          Mesailer
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
          :items="workHours"
          filename="mesailer"
          :headers="[includedDataTableHeaders.map((header) => header.title)]"
        />
      </v-toolbar>
    </template>
    <template #[`item.normalmesaisaat`]="{ item }">
      {{ formatToLocale(item.normalmesaisaat) }}
    </template>
    <template #[`item.toplamfazlamesaisaat`]="{ item }">
      {{ formatToLocale(item.toplamfazlamesaisaat) }}
    </template>
    <template #[`item.gecemesaisisaat`]="{ item }">
      {{ formatToLocale(item.gecemesaisisaat) }}
    </template>
    <template #[`item.haftasonumesaisisaat`]="{ item }">
      {{ formatToLocale(item.haftasonumesaisisaat) }}
    </template>
  </v-data-table>

  <GixBarChart
    :loading
    title="Toplam Mesai Grafiği"
    :axis-data="workHoursChartData.axisData"
    :bar-series-data="workHoursChartData.barSeriesData"
    :index-axis="xs.value ? 'x' : 'y'"
  />
  <GixBarChart
    :loading
    title="Normal Mesai Grafiği"
    :axis-data="regularWorkHoursChartData.axisData"
    :bar-series-data="regularWorkHoursChartData.barSeriesData"
    :index-axis="xs.value ? 'x' : 'y'"
  />
  <GixBarChart
    :loading
    title="Fazla Mesai Grafiği (ek mesai + gece mesaisi + hafta sonu mesaisi)"
    :axis-data="extraWorkHoursChartData.axisData"
    :bar-series-data="extraWorkHoursChartData.barSeriesData"
    :index-axis="xs.value ? 'x' : 'y'"
  />
</template>
