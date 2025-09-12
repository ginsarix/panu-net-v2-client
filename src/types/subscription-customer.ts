import type { CreateUpdateDate } from './create-update-date';

export interface SubscriptionCustomer extends Partial<CreateUpdateDate> {
  id: number;
  customerCode: number | null;
  title: string;
  phone: string | null;
  email: string;
  address: string | null;
  status: boolean;
  manager: string | null;
}
