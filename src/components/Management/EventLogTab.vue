<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, reactive, ref, watch } from 'vue';

import GixRefreshButton from '@/components/GixRefreshButton.vue';
import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useDisplayStore } from '@/stores/display.ts';
import { useEventLogStore } from '@/stores/event-log.ts';
import type { DataTableHeaders } from '@/types/data-table-headers.ts';
import { formatDateTime } from '@/utils/formatting.ts';

const { mobile } = storeToRefs(useDisplayStore());
const store = useEventLogStore();
const { eventLogs, totalCount, filterOptions } = storeToRefs(store);

const loaded = ref(false);
const currentPagination = ref<{ page?: number; itemsPerPage?: number }>({});
const filters = reactive<{
  resourceType: string | null;
  action: string | null;
  status: string | null;
}>({ resourceType: null, action: null, status: null });

const loadLogs = async (options?: { page?: number; itemsPerPage?: number }) => {
  if (options) currentPagination.value = { page: options.page, itemsPerPage: options.itemsPerPage };
  try {
    await store.loadEventLogs({
      ...currentPagination.value,
      resourceType: filters.resourceType ?? undefined,
      action: filters.action ?? undefined,
      status: filters.status ?? undefined,
    });
  } catch (error) {
    console.error(error);
  } finally {
    loaded.value = true;
  }
};

onMounted(async () => {
  await store.loadFilterOptions();
});

watch([() => filters.resourceType, () => filters.action, () => filters.status], () => {
  void loadLogs({ page: 1, itemsPerPage: currentPagination.value.itemsPerPage });
});

const statusColor = (status: string) => {
  if (status === 'başarılı') return 'success';
  if (status === 'başarısız') return 'error';
  return undefined;
};

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'ID', key: 'id', sortable: false, toggled: false },
  { title: 'Tarih', key: 'createdAt', sortable: false, toggled: true },
  { title: 'Kaynak Türü', key: 'resourceType', sortable: false, toggled: true },
  { title: 'Eylem', key: 'action', sortable: false, toggled: true },
  { title: 'Aktör', key: 'actorName', sortable: false, toggled: true },
  { title: 'Durum', key: 'status', sortable: false, toggled: true },
  { title: 'Kaynak ID', key: 'resourceId', sortable: false, toggled: false },
  { title: 'IP Adresi', key: 'ipAddress', sortable: false, toggled: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

useColumnVisibility('event-log', dataTableHeaders);
</script>

<template>
  <v-data-table-server
    @update:options="loadLogs"
    :headers="includedDataTableHeaders"
    :items-length="totalCount"
    :items="eventLogs"
    :loading="!loaded"
    class="rounded-lg elevation-0 border"
    fixed-header
    hover
    :mobile="mobile.value"
    loading-text="Olaylar yükleniyor..."
    no-data-text="Olay bulunamadı."
    items-per-page-text="Sayfa başı olay"
    :items-per-page-options="[10, 25, 50, 100]"
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-clipboard-text-clock" size="x-small" start />
          Olay Kayıtları
        </v-toolbar-title>
        <GixTogglerMenu
          menu-activator-btn-text="Kolonlar"
          menu-activator-btn-class="rounded-lg border me-3"
          menu-activator-btn-icon="mdi-filter-variant"
          v-model:toggle-items="dataTableHeaders"
        />
        <GixRefreshButton class="me-5" :refresh-fn="() => loadLogs()" />
      </v-toolbar>
      <v-divider />
      <div class="d-flex flex-wrap ga-3 pa-4">
        <v-select
          v-model="filters.resourceType"
          :items="filterOptions.resourceTypes"
          label="Kaynak Türü"
          clearable
          variant="outlined"
          rounded="lg"
          density="compact"
          hide-details
          style="min-width: 180px; max-width: 220px"
        />
        <v-select
          v-model="filters.action"
          :items="filterOptions.actions"
          label="Eylem"
          clearable
          variant="outlined"
          rounded="lg"
          density="compact"
          hide-details
          style="min-width: 220px; max-width: 300px"
        />
        <v-select
          v-model="filters.status"
          :items="filterOptions.statuses"
          label="Durum"
          clearable
          variant="outlined"
          rounded="lg"
          density="compact"
          hide-details
          style="min-width: 150px; max-width: 180px"
        />
      </div>
      <v-divider />
    </template>

    <template #[`item.createdAt`]="{ item }">
      {{ formatDateTime(item.createdAt) }}
    </template>

    <template #[`item.actorName`]="{ item }">
      {{ item.actorName ?? 'Sistem' }}
    </template>

    <template #[`item.status`]="{ item }">
      <v-chip :color="statusColor(item.status)" size="small" density="comfortable">
        {{ item.status }}
      </v-chip>
    </template>

    <template #[`item.resourceId`]="{ item }">
      {{ item.resourceId ?? '-' }}
    </template>

    <template #[`item.ipAddress`]="{ item }">
      {{ item.ipAddress ?? '-' }}
    </template>
  </v-data-table-server>
</template>
