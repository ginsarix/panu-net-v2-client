import { defineStore } from 'pinia';
import { ref } from 'vue';

import { type UserServerDataTableOptions, getUsers } from '@/services/api/users';
import type { User } from '@/types/user.ts';

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([]);
  const totalUsersCount = ref(0);

  const loadUsers = async (params?: UserServerDataTableOptions) => {
    const response = await getUsers(params);

    users.value = response.users;
    totalUsersCount.value = response.total;
  };

  const addUserToList = (user: User, addToStart = false) => {
    if (addToStart) {
      users.value = [user, ...users.value];
      return;
    }

    users.value = [...users.value, user];
  };

  const updateUserById = (id: string | number, data: Partial<User>) => {
    users.value = users.value.map((u) => (u.id === id ? { ...u, ...data } : u));
  };

  const removeUsersById = (ids: Array<string | number>) => {
    const idSet = new Set(ids);

    users.value = users.value.filter((u) => !idSet.has(u.id ?? -1));
  };

  return {
    users,
    totalUsersCount,
    loadUsers,
    addUserToList,
    updateUserById,
    removeUsersById,
  };
});
