import type { Company } from '@/types/company.ts';
import type { ServerDataTableOptions } from '@/types/server-data-table-options.ts';

import { cleanPayload, trpc } from '../trpc.ts';

export type CompanyServerDataTableOptions = ServerDataTableOptions<
  'code' | 'status' | 'creationDate' | 'updatedOn' | 'name' | 'licenseDate'
>;

export const getCompanies = (params?: CompanyServerDataTableOptions) =>
  trpc.company.getCompanies.query(params ?? {});

export const createCompany = (data: Company) => trpc.company.createCompany.mutate(data);

export const patchCompany = async (id: number, data: Partial<Company>) => {
  const cleanedData = cleanPayload(data);
  return await trpc.company.updateCompany.mutate({
    id,
    data: cleanedData,
  });
};

export const deleteCompany = (id: number) => trpc.company.deleteCompany.mutate({ id });

export const deleteCompanies = (ids: number[]) => trpc.company.deleteCompanies.mutate({ ids });

export const setSelectedCompany = (id: number) => trpc.company.selectCompany.mutate({ id });

export const getSelectedCompany = () => trpc.company.getSelectedCompany.query();

export const setSelectedPeriod = (periodCode: number) =>
  trpc.company.setPeriod.mutate({ periodCode });

export const getSelectedPeriod = () => trpc.company.getSelectedPeriod.query();

export const getPeriods = () => trpc.company.getPeriods.query();
