import { cleanPayload, trpc } from '@/services/trpc.ts';
import type { ServerDataTableOptions } from '@/types/server-data-table-options.ts';
import type { User } from '@/types/user.ts';
import type { WithRequiredProperty } from '@/types/with-required-property.ts';

export type UserSortKeys = 'creationDate' | 'updatedOn' | 'name' | 'email';

export type UserServerDataTableOptions = ServerDataTableOptions<UserSortKeys>;

export const getUsers = async (params?: UserServerDataTableOptions) => {
  return await trpc.user.getUsers.query(params ?? {});
};

export const createUser = async (data: WithRequiredProperty<User, 'password'>) => {
  return await trpc.user.createUser.mutate(data);
};

export const patchUser = async (id: number, data: Partial<User>) => {
  data = cleanPayload(data);
  return await trpc.user.updateUser.mutate({ id, data });
};

export const deleteUser = async (id: number) => {
  return await trpc.user.deleteUser.mutate({ id });
};

export const deleteUsers = async (ids: number[]) => {
  return await trpc.user.deleteUsers.mutate({ ids });
};
