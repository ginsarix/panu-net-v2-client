import { storeToRefs } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';

import CreditorsTab from '@/components/DebtorsCreditors/CreditorsTab.vue';
import DebtorsTab from '@/components/DebtorsCreditors/DebtorsTab.vue';
import CompaniesTab from '@/components/Management/CompaniesTab.vue';
import UsersTab from '@/components/Management/UsersTab.vue';
import { pinia } from '@/plugins/pinia';
import { useCurrentUserStore } from '@/stores/current-user';
import DebtorsCreditorsView from '@/views/DebtorsCreditorsView.vue';
import LoginView from '@/views/LoginView.vue';
import ManagementView from '@/views/ManagementView.vue';

import HomeView from '../views/HomeView.vue';

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
      path: '/stock',
      component: HomeView,
      children: [
        {
          path: 'moving-stock',
          component: HomeView,
        },
        {
          path: 'idle-stock',
          component: HomeView,
        },
        {
          path: 'stock-profitability',
          component: HomeView,
        },
        {
          path: 'physical-stock',
          component: HomeView,
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
