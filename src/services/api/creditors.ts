import { trpc } from '@/services/trpc.ts';

export const getCreditors = async () => await trpc.creditor.getCreditors.query();
