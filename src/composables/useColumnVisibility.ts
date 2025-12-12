import { watch, type Ref } from "vue";
import { useTableSettingsStore } from "@/stores/table-settings";
import { storeToRefs } from "pinia";
import type { DataTableHeaders } from "@/types/data-table-headers";

export const useColumnVisibility = (
  table: string,
  dataTableHeaders: Ref<DataTableHeaders[]>,
  keysToIgnore?: string[]
) => {
  const tableSettingsStore = useTableSettingsStore();
  const { columns } = storeToRefs(tableSettingsStore);

  let syncingStore = false;
  let syncingFromHeaders = false;

  const columnUpdaterWatcherHandle = watch(
    dataTableHeaders,
    (newHeaders, oldHeaders) => {
      if (syncingFromHeaders) return; // ← prevent trigger loop

      syncingStore = true;

      const changedHeaders = newHeaders
      .map((item, i) => ({ item, index: i }))
      .filter(({ item, index }) => item !== oldHeaders?.[index]);

      for (const { item: column } of changedHeaders) {
        if (keysToIgnore?.includes(column.key)) continue;

        tableSettingsStore.setColumnVisibility(table, column.key, column.toggled)
      }
      syncingStore = false;
    },
    { deep: true }
  );

  const columnSyncerWatcherHandle = watch(
    columns,
    (newColumns) => {
      if (syncingStore) return; // ← prevent trigger loop

      syncingFromHeaders = true;
      for (const setting of newColumns) {
        if (setting.table !== table) continue;

        const header = dataTableHeaders.value.find((h) => h.key === setting.key);
        if (header && header.toggled !== setting.toggled) {
          header.toggled = setting.toggled;
        }
      }
      syncingFromHeaders = false;
    },
    { immediate: true, deep: true }
  );

  return { columnSyncerWatcherHandle, columnUpdaterWatcherHandle };
};
