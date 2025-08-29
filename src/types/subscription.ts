export interface Subscription {
  id: number;
  startDate: string;
  endDate: string;
  subscriptionType: 'domain' | 'ssl' | 'hosting' | 'mail';
  userId: number;
  creationDate: string;
}
