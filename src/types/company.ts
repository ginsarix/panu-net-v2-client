import type { CreateUpdateDate } from '@/types/create-update-date.ts';

import type { Nullish } from './nullish';

export interface Company extends Nullish<CreateUpdateDate> {
  id?: number;
  code: string;
  name: string;
  manager: string;
  phone?: string | null;
  licenseDate: string;
  status: boolean;
  webServiceSource: string;
  webServiceUsername: string;
  serverName: string;
  apiKey: string;
  apiSecret: string;
}
