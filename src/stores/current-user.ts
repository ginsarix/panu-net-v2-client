import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getLogin, logout } from '@/services/api/auth';

export const useCurrentUserStore = defineStore('currentUser', () => {
  const currentUser = ref<{ name: string; role: 'user' | 'admin' } | null>(null);
  const loadCurrentUser = async () => {
    const login = await getLogin();
    if (!login) {
      currentUser.value = null;
      return;
    }

    currentUser.value = login;
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
