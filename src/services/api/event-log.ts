import { trpc } from '@/services/trpc.ts';

export interface EventLogServerDataTableOptions {
  page?: number;
  itemsPerPage?: number;
  resourceType?: string;
  action?: string;
  status?: string;
}

export const getEventLogs = async (params?: EventLogServerDataTableOptions) => {
  return await trpc.eventLog.getEventLogs.query(params ?? {});
};

export const getEventLogFilterOptions = async () => {
  return await trpc.eventLog.getFilterOptions.query();
};
