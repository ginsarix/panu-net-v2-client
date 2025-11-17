import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useCurrentUserStore } from '@/stores/current-user';
import { usePageRolesStore } from '@/stores/page-roles';

/**
 * Composable to check if the current user has access to specific page roles
 */
export const usePageRoleAccess = () => {
  const currentUserStore = useCurrentUserStore();
  const { currentUser } = storeToRefs(currentUserStore);

  const pageRolesStore = usePageRolesStore();
  const { pageRoles } = storeToRefs(pageRolesStore);

  // Map route meta keys to actual page role keys
  const roleKeyMap = {
    DEBTOR_VIEW: 'debtor_view',
    CREDITOR_VIEW: 'creditor_view',
    SUBSCRIPTION_VIEW: 'subscription_view',
    CUSTOMER_VIEW: 'customer_view',
    REPORT_VIEW: 'report_view',
  } as const;

  const hasPageRole = (roleKey: keyof typeof roleKeyMap): boolean => {
    // Admins have access to everything
    if (currentUser.value?.role === 'admin') {
      return true;
    }

    // If user is not logged in, no access
    if (!currentUser.value || !currentUser.value.pageRoles) {
      return false;
    }

    const roleKeyValue = roleKeyMap[roleKey];
    if (!roleKeyValue) {
      return false;
    }

    const requiredRole = pageRoles.value.find((role) => role.key === roleKeyValue);
    if (!requiredRole || !requiredRole.id) {
      return false;
    }

    return currentUser.value.pageRoles.includes(requiredRole.id);
  };

  const hasAccessToPath = (path: string): boolean => {
    // Admins have access to everything
    if (currentUser.value?.role === 'admin') {
      return true;
    }

    // Map paths to role keys
    const pathToRoleMap: Record<string, keyof typeof roleKeyMap> = {
      '/dbcr/debtors': 'DEBTOR_VIEW',
      '/dbcr/creditors': 'CREDITOR_VIEW',
      '/task-tracking/subscriptions': 'SUBSCRIPTION_VIEW',
      '/task-tracking/customers': 'CUSTOMER_VIEW',
      '/reports/general-report': 'REPORT_VIEW',
    };

    const roleKey = pathToRoleMap[path];
    if (!roleKey) {
      // If path is not in the map, allow access (for paths without role requirements)
      return true;
    }

    return hasPageRole(roleKey);
  };

  return {
    hasPageRole,
    hasAccessToPath,
    isAdmin: computed(() => currentUser.value?.role === 'admin'),
  };
};
