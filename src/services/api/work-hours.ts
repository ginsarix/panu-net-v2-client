import { trpc } from '../trpc';

export const getWorkHours = async () => await trpc.workHours.getWorkHours.query();
