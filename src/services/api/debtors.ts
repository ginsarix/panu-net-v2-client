import { trpc } from '@/services/trpc.ts';

export const getDebtors = async (params: { companyCode: number }) =>
  await trpc.debtor.getDebtors.query(params);
