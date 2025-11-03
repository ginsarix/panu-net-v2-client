import { formatDateTime } from '@/utils/formatting';

import { trpc } from '../trpc';

const formatCdates = <T extends { _cdate?: string }>(arr: T[]) => {
  arr.forEach((obj) => {
    if (obj._cdate) {
      obj._cdate = formatDateTime(obj._cdate) as string;
    }
  });
};

export const getGeneralReport = async (
  filters: Parameters<typeof trpc.report.getGeneralReport.query>[0],
) => {
  const generalReport = await trpc.report.getGeneralReport.query(filters);

  formatCdates(generalReport.waybills.result);
  formatCdates(generalReport.invoices.result);
  formatCdates(generalReport.bankReceipts.result);
  formatCdates(generalReport.materialReceipts.result);
  formatCdates(generalReport.creditCardCollections.result);
  formatCdates(generalReport.checkEntries.result);

  return generalReport;
};

export const getCashAccountMovements = async (cashAccountKey: string) => {
  const cashAccountMovements = await trpc.report.getCashAccountMovements.query({ cashAccountKey });
  formatCdates(cashAccountMovements.result);
  return cashAccountMovements.result.map((c) => ({ ...c, cashAccountKey }));
};
