import type { CreateUpdateDate } from '@/types/create-update-date.ts';

export interface User extends Partial<CreateUpdateDate> {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role?: string;
  phone?: string;
  companies: number[];
}
