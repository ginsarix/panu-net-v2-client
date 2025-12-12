import { watch, type Ref } from "vue";
import { useTableSettingsStore } from "@/stores/table-settings";
import { storeToRefs } from "pinia";
import type { ToggleItem } from "@/types/toggle-item";

export const useColumnFilters = (
  table: string,
  filterToggles: Ref<ToggleItem[]>,
) => {
  const tableSettingsStore = useTableSettingsStore();
  const { filters } = storeToRefs(tableSettingsStore);

  let syncingStore = false;
  let syncingFromToggler = false;

  const filterUpdaterWatcherHandle = watch(
    filterToggles,
    (newToggles, oldToggles) => {
      if (syncingFromToggler) return; // ← prevent trigger loop

      syncingStore = true;

      const changedHeaders = newToggles
      .map((item, i) => ({ item, index: i }))
      .filter(({ item, index }) => item !== oldToggles?.[index]);

      for (const { item: column } of changedHeaders) {
        tableSettingsStore.setColumnFilter(table, column.key, column.toggled)
      }
      syncingStore = false;
    },
    { deep: true }
  );

  const filterSyncerWatcherHandle = watch(
    filters,
    (newFilters) => {
      if (syncingStore) return; // ← prevent trigger loop

      syncingFromToggler = true;
      for (const setting of newFilters) {
        if (setting.table !== table) continue;

        const header = filterToggles.value.find((h) => h.key === setting.key);
        if (header && header.toggled !== setting.toggled) {
          header.toggled = setting.toggled;
        }
      }
      syncingFromToggler = false;
    },
    { immediate: true, deep: true }
  );

  return { filterSyncerWatcherHandle, filterUpdaterWatcherHandle };
};
