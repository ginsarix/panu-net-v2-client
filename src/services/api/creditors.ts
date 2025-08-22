import { trpc } from '@/services/trpc.ts';

export const getCreditors = async (params: { companyCode: string }) =>
  await trpc.creditor.getCreditors.query(params);
