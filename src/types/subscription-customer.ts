export interface SubscriptionCustomer {
  id: number;
  customerCode: number | null;
  title: string;
  phone: string | null;
  email: string;
  address: string | null;
  status: boolean;
  manager: string | null;
  creationDate: string;
}
