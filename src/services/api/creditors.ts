import { trpc } from '@/services/trpc.ts';

export const getCreditors = async (params: { companyCode: string; periodCode: string | number }) =>
  await trpc.creditor.getCreditors.query(params);
