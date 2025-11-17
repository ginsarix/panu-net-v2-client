import type { CreateUpdateDate } from './create-update-date';
import type { Nullish } from './nullish';

export interface SubscriptionCustomer extends Nullish<CreateUpdateDate> {
  id: number;
  customerCode: string | null;
  title: string;
  phone: string | null;
  email: string;
  remindExpiryWithEmail: boolean;
  remindExpiryWithSms: boolean;
  address: string | null;
  status: boolean;
  manager: string | null;
  subscriptionIds?: number[];
}
