import { trpc } from '@/services/trpc.ts';

export const getAllPageRoles = async () => {
  return await trpc.pageRole.getAllPageRoles.query();
};

export const getUserPageRoles = async (userId: number) => {
  return await trpc.pageRole.getUserPageRoles.query({ userId });
};

export const assignPageRolesToUser = async (userId: number, pageRoleIds: number[]) => {
  return await trpc.pageRole.assignPageRolesToUser.mutate({ userId, pageRoleIds });
};

export const removePageRolesFromUser = async (userId: number, pageRoleIds: number[]) => {
  return await trpc.pageRole.removePageRolesFromUser.mutate({ userId, pageRoleIds });
};
