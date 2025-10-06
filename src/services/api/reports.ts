import { trpc } from '../trpc';

export const getGeneralReport = async (
  filters: Parameters<typeof trpc.report.getGeneralReport.query>[0],
) => await trpc.report.getGeneralReport.query(filters);
