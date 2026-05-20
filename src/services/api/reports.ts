import { formatCdates, mapCashAccountMovementTypes } from '@/utils/formatting';

import { trpc } from '../trpc';

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

  cashAccountMovements.result.forEach((c) => {
    c.turuack = mapCashAccountMovementTypes(c.turu);
  });

  return cashAccountMovements.result.map((c) => ({ ...c, cashAccountKey }));
};
