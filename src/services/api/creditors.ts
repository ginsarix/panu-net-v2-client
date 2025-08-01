import { trpc } from '@/services/trpc.ts';

export const getCreditors = async (params: { companyCode: number }) =>
  await trpc.creditor.getCreditors.query(params);
