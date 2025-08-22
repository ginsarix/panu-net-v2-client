import { trpc } from '@/services/trpc.ts';

export const getDebtors = async (params: { companyCode: string }) =>
  await trpc.debtor.getDebtors.query(params);
