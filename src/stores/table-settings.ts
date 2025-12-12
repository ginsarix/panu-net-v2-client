import { defineStore } from 'pinia'
import { readonly, ref, watch } from 'vue'

export interface TableSetting {
  table: string;
  key: string
  toggled: boolean
}

const COLUMNS_KEY = 'table-columns'
const FILTERS_KEY = 'table-filters'

export const useTableSettingsStore = defineStore('tableSettings', () => {
  const columns = ref<TableSetting[]>([])
  const filters = ref<TableSetting[]>([])

  // load from localStorage on store creation
  const rawColumns = localStorage.getItem(COLUMNS_KEY)
  const rawFilters = localStorage.getItem(FILTERS_KEY)

  if (rawColumns) {
    try {
      columns.value = JSON.parse(rawColumns)
    } catch (e) {
      console.warn('Failed to parse saved columns, resetting...', e)
      localStorage.removeItem(COLUMNS_KEY)
    }
  }

  if (rawFilters) {
    try {
      filters.value = JSON.parse(rawFilters)
    } catch (e) {
      console.warn('Failed to parse saved filters, resetting...', e)
      localStorage.removeItem(FILTERS_KEY)
    }
  }

  watch(
    [columns, filters],
    ([newColumns, newFilters]) => {
      localStorage.setItem(COLUMNS_KEY, JSON.stringify(newColumns))
      localStorage.setItem(FILTERS_KEY, JSON.stringify(newFilters))
    }, { deep: true }
  )

  const toggleColumn = (table: string, key: string) => {
    const setting = columns.value.find(c => c.table === table && c.key === key)
    if (setting) {
      setting.toggled = !setting.toggled
    } else {
      columns.value.push({ table, key, toggled: true })
    }
  }

  const toggleFilter = (table: string, key: string) => {
    const setting = filters.value.find(f => f.table === table && f.key === key)
    if (setting) {
      setting.toggled = !setting.toggled
    } else {
      filters.value.push({ table, key, toggled: true })
    }
  }

  const setColumnVisibility = (table: string, key: string, toggled: boolean) => {
    const existing = columns.value.find(c => c.table === table && c.key === key)
    if (existing) {
      existing.toggled = toggled
    } else {
      columns.value.push({ table, key, toggled })
    }
  }

  const setColumnFilter = (table: string, key: string, toggled: boolean) => {
    const existing = filters.value.find(f => f.table === table && f.key === key)
    if (existing) {
      existing.toggled = toggled
    } else {
      filters.value.push({ table, key, toggled })
    }
  }

  const reset = () => {
    columns.value = []
    filters.value = []
    localStorage.removeItem(COLUMNS_KEY)
    localStorage.removeItem(FILTERS_KEY)
  }

  return {
    columns: readonly(columns),
    filters: readonly(filters),
    toggleColumn,
    toggleFilter,
    setColumnVisibility,
    setColumnFilter,
    reset,
  }
})
