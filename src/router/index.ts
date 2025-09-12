import { storeToRefs } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';

import { pinia } from '@/plugins/pinia';
import { useCurrentUserStore } from '@/stores/current-user';

const CreditorsTab = () => import('@/components/DebtorsCreditors/CreditorsTab.vue');
const DebtorsTab = () => import('@/components/DebtorsCreditors/DebtorsTab.vue');
const CompaniesTab = () => import('@/components/Management/CompaniesTab.vue');
const UsersTab = () => import('@/components/Management/UsersTab.vue');
const CustomersTab = () => import('@/components/TaskTracking/CustomersTab.vue');
const SubscriptionsTab = () => import('@/components/TaskTracking/SubscriptionsTab.vue');
const DebtorsCreditorsView = () => import('@/views/DebtorsCreditorsView.vue');
const LoginView = () => import('@/views/LoginView.vue');
const ManagementView = () => import('@/views/ManagementView.vue');
const TaskTrackingView = () => import('@/views/TaskTrackingView.vue');
const HomeView = () => import('../views/HomeView.vue');

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
        },
        {
          path: 'creditors',
          component: CreditorsTab,
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
        },
        {
          path: 'customers',
          component: CustomersTab,
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
      path: '/orders',
      component: HomeView,
      children: [
        {
          path: 'received-orders',
          component: HomeView,
        },
        {
          path: 'dispatched-orders',
          component: HomeView,
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
});

export default router;
