export interface ServerDataTableOptions<T extends string> {
  page?: number;
  itemsPerPage?: number;
  sortBy?: { key: T; order: 'asc' | 'desc' }[];
  search?: string;
}
