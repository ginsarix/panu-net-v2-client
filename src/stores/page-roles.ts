import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getAllPageRoles } from '@/services/api/page-roles';
import type { PageRole } from '@/types/page-role.ts';

export const usePageRolesStore = defineStore('pageRoles', () => {
  const pageRoles = ref<PageRole[]>([]);

  const loadPageRoles = async () => {
    const response = await getAllPageRoles();
    pageRoles.value = response.pageRoles;
  };

  const getPageRoleById = (id: number) => {
    return pageRoles.value.find((role) => role.id === id);
  };

  return {
    pageRoles,
    loadPageRoles,
    getPageRoleById,
  };
});
