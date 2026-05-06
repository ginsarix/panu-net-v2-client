import { trpc } from '../trpc';

export const getWaybills = async () => await trpc.waybill.getWaybills.query();

export const forwardWaybillsToUsers = async (
  input: Parameters<typeof trpc.waybill.forwardWaybillsToUsers.mutate>['0'],
) => await trpc.waybill.forwardWaybillsToUsers.mutate(input);
