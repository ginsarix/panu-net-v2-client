import type { CreateUpdateDate } from '@/types/create-update-date.ts';

import type { Nullish } from './nullish';

export interface Company extends Nullish<CreateUpdateDate> {
  id?: number;
  code: number;
  name: string;
  manager: string;
  phone?: string | null;
  licenseDate: Date;
  status: boolean;
  webServiceSource: string;
  webServiceUsername: string;
  apiKey: string;
  apiSecret: string;
}
