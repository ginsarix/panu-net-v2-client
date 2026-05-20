import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  type EventLogServerDataTableOptions,
  getEventLogFilterOptions,
  getEventLogs,
} from '@/services/api/event-log.ts';

export interface EventLogRow {
  id: number;
  resourceType: string;
  resourceId: string | null;
  action: string;
  actorId: number | null;
  actorName: string | null;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export const useEventLogStore = defineStore('eventLog', () => {
  const eventLogs = ref<EventLogRow[]>([]);
  const totalCount = ref(0);
  const filterOptions = ref<{
    resourceTypes: string[];
    actions: string[];
    statuses: string[];
  }>({ resourceTypes: [], actions: [], statuses: [] });

  const loadEventLogs = async (params?: EventLogServerDataTableOptions) => {
    const response = await getEventLogs(params);
    eventLogs.value = response.rows;
    totalCount.value = response.totalCount;
  };

  const loadFilterOptions = async () => {
    const options = await getEventLogFilterOptions();
    filterOptions.value = options;
  };

  return { eventLogs, totalCount, filterOptions, loadEventLogs, loadFilterOptions };
});
