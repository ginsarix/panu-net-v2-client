import type { CreateUpdateDate } from '@/types/create-update-date.ts';

import type { Nullish } from './nullish';

export interface PageRole extends Nullish<CreateUpdateDate> {
  id?: number;
  key: string;
  name: string;
  description?: string | null;
  pagePath: string;
}

