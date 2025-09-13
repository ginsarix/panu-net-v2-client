import type { CreateUpdateDate } from '@/types/create-update-date.ts';

import type { Nullish } from './nullish';

export interface User extends Nullish<CreateUpdateDate> {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role?: string;
  phone?: string | null;
  companies: number[];
}
