import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getLogin, logout } from '@/services/api/auth';
import { getUserPageRoles } from '@/services/api/page-roles';

export const useCurrentUserStore = defineStore('currentUser', () => {
  const currentUser = ref<{
    id: string;
    name: string;
    role: 'user' | 'admin';
    pageRoleIds?: number[];
  } | null>(null);
  const loadCurrentUser = async () => {
    const login = await getLogin();
    if (!login) {
      currentUser.value = null;
      return;
    }

    // Load page roles for non-admin users
    let pageRoleIds: number[] = [];
    if (login.role !== 'admin') {
      try {
        const pageRolesResponse = await getUserPageRoles(Number(login.id));
        pageRoleIds = pageRolesResponse.pageRoleIds || [];
      } catch (error) {
        console.error('Failed to load user page roles:', error);
      }
    }

    currentUser.value = { ...login, pageRoleIds };
  };
  const logoutCurrentUser = async () => {
    try {
      await logout();
      currentUser.value = null;
    } catch (error) {
      console.error('Error during logout: ', error);
    }
  };

  return { currentUser, loadCurrentUser, logoutCurrentUser };
});
