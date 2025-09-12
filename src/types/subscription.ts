import type { CreateUpdateDate } from './create-update-date';

export interface Subscription extends Partial<CreateUpdateDate> {
  id: number;
  startDate: string;
  endDate: string;
  subscriptionType: 'domain' | 'ssl' | 'hosting' | 'mail';
  userId: number;
}
