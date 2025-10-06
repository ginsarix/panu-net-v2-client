import { trpc } from '@/services/trpc.ts';

export const getDebtors = async () => await trpc.debtor.getDebtors.query();
