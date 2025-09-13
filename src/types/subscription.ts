import type { CreateUpdateDate } from './create-update-date';
import type { Nullish } from './nullish';

export interface Subscription extends Nullish<CreateUpdateDate> {
  id: number;
  startDate: string;
  endDate: string;
  subscriptionType: 'domain' | 'ssl' | 'hosting' | 'mail';
  userId: number;
}
