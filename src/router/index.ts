import { storeToRefs } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';

import pinia from '@/plugins/pinia';
import { useCurrentUserStore } from '@/stores/current-user';

const CreditorsTab = () => import('@/components/DebtorsCreditors/CreditorsTab.vue');
const DebtorsTab = () => import('@/components/DebtorsCreditors/DebtorsTab.vue');
const CompaniesTab = () => import('@/components/Management/CompaniesTab.vue');
const UsersTab = () => import('@/components/Management/UsersTab.vue');
const CustomersTab = () => import('@/components/TaskTracking/CustomersTab.vue');
const SubscriptionsTab = () => import('@/components/TaskTracking/SubscriptionsTab.vue');
const GeneralReport = () => import('@/components/Reports/GeneralReport.vue');
const DebtorsCreditorsView = () => import('@/views/DebtorsCreditorsView.vue');
const LoginView = () => import('@/views/LoginView.vue');
const ManagementView = () => import('@/views/ManagementView.vue');
const TaskTrackingView = () => import('@/views/TaskTrackingView.vue');
const HomeView = () => import('../views/HomeView.vue');
const ReportsView = () => import('@/views/ReportsView.vue');

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: HomeView,
    },
    {
      path: '/login',
      component: LoginView,
    },
    {
      path: '/dbcr',
      component: DebtorsCreditorsView,
      children: [
        {
          path: 'debtors',
          component: DebtorsTab,
          meta: { requiredPageRole: 'DEBTOR_VIEW' },
        },
        {
          path: 'creditors',
          component: CreditorsTab,
          meta: { requiredPageRole: 'CREDITOR_VIEW' },
        },
      ],
    },
    {
      path: '/task-tracking',
      component: TaskTrackingView,
      children: [
        {
          path: 'subscriptions',
          component: SubscriptionsTab,
          meta: { requiredPageRole: 'SUBSCRIPTION_VIEW' },
        },
        {
          path: 'customers',
          component: CustomersTab,
          meta: { requiredPageRole: 'CUSTOMER_VIEW' },
        },
      ],
    },
    {
      path: '/management',
      component: ManagementView,
      children: [
        {
          path: 'users',
          component: UsersTab,
        },
        {
          path: 'companies',
          component: CompaniesTab,
        },
        {
          path: 'modules',
          component: HomeView,
        },
      ],
    },
    {
      path: '/reports',
      component: ReportsView,
      children: [
        {
          path: 'general-report',
          component: GeneralReport,
          meta: { requiredPageRole: 'REPORT_VIEW' },
        },
      ],
    },
  ],
});

const currentUserStore = useCurrentUserStore(pinia);
const { currentUser } = storeToRefs(currentUserStore);

await currentUserStore.loadCurrentUser();

router.beforeEach(async (to) => {
  if (to.path !== '/login' && !currentUser.value) {
    return '/login';
  }

  // Check page role requirements
  if (currentUser.value && to.meta.requiredPageRole) {
    // Admins bypass page role checks
    if (currentUser.value.role === 'admin') {
      return;
    }

    // Check if user has the required page role
    const requiredRoleKey = to.meta.requiredPageRole as string;
    const userPageRoleIds = currentUser.value.pageRoleIds || [];

    // We need to check if the user has a page role that matches the required role key
    // This requires loading page roles and matching by key
    const pageRolesStore = (await import('@/stores/page-roles')).usePageRolesStore();
    await pageRolesStore.loadPageRoles();

    // Map route meta keys to actual page role keys
    const roleKeyMap: Record<string, string> = {
      DEBTOR_VIEW: 'debtor_view',
      CREDITOR_VIEW: 'creditor_view',
      SUBSCRIPTION_VIEW: 'subscription_view',
      CUSTOMER_VIEW: 'customer_view',
      REPORT_VIEW: 'report_view',
    };

    const requiredRoleKeyValue = roleKeyMap[requiredRoleKey] || requiredRoleKey.toLowerCase();
    const requiredRole = pageRolesStore.pageRoles.find((role) => role.key === requiredRoleKeyValue);

    if (!requiredRole || !userPageRoleIds.includes(requiredRole.id!)) {
      // Redirect to home or show unauthorized message
      return '/';
    }
  }
});

export default router;
