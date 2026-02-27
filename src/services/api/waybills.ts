import { trpc } from '../trpc';

export const getWaybills = async () => await trpc.waybill.getWaybills.query();
