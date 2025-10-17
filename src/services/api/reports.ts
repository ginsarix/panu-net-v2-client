import { formatDateTime } from '@/utils/formatting';

import { trpc } from '../trpc';

export const getGeneralReport = async (
  filters: Parameters<typeof trpc.report.getGeneralReport.query>[0],
) => {
  const generalReport = await trpc.report.getGeneralReport.query(filters);
  const formatCdates = <T extends { _cdate?: string }>(arr: T[]) => {
    arr.forEach((obj) => {
      if (obj._cdate) {
        obj._cdate = formatDateTime(obj._cdate) as string;
      }
    });
  };
  formatCdates(generalReport.waybills.result);
  formatCdates(generalReport.invoices.result);
  formatCdates(generalReport.bankReceipts.result);
  formatCdates(generalReport.materialReceipts.result);
  formatCdates(generalReport.creditCardCollections.result);

  return generalReport;
};
