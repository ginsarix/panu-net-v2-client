import { storeToRefs } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';

import pinia from '@/plugins/pinia';
import { useCurrentUserStore } from '@/stores/current-user';

const StocksView = () => import('@/views/StocksView.vue');
const StockListTab = () => import('@/components/Stocks/StockListTab.vue');
const ServiceCardTab = () => import('@/components/Stocks/ServiceCardTab.vue');
const CreditorsTab = () => import('@/components/DebtorsCreditors/CreditorsTab.vue');
const DebtorsTab = () => import('@/components/DebtorsCreditors/DebtorsTab.vue');
const CompaniesTab = () => import('@/components/Management/CompaniesTab.vue');
const ContractsTab = () => import('@/components/Management/ContractsTab.vue');
const ContractsView = () => import('@/components/ContractsView.vue');
const DefinitionsView = () => import('@/views/DefinitionsView.vue');
const UsersTab = () => import('@/components/Management/UsersTab.vue');
const CustomersTab = () => import('@/components/TaskTracking/CustomersTab.vue');
const SubscriptionsTab = () => import('@/components/TaskTracking/SubscriptionsTab.vue');
const GeneralReport = () => import('@/components/Reports/GeneralReport.vue');
const DebtorsCreditorsView = () => import('@/views/DebtorsCreditorsView.vue');
const LoginView = () => import('@/views/LoginView.vue');
const ManagementView = () => import('@/views/ManagementView.vue');
const TaskTrackingView = () => import('@/views/TaskTrackingView.vue');
const HomeView = () => import('@/views/HomeView.vue');
const ReportsView = () => import('@/views/ReportsView.vue');
const WorkHoursTab = () => import('@/components/WorkHoursTab.vue');
const OrdersView = () => import('@/views/OrdersView.vue');
const OrdersTab = () => import('@/components/OrdersTab.vue');
const WaybillsTab = () => import('@/components/WaybillsTab.vue');
const SupportTab = () => import('@/components/SupportTab.vue');
const TicketPage = () => import('@/components/TicketPage.vue');

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
      path: '/stocks',
      component: StocksView,
      children: [
        {
          path: 'list',
          component: StockListTab,
          meta: { requiredPageRole: 'STOCKS_VIEW' },
        },
        {
          path: 'service-list',
          component: ServiceCardTab,
          meta: { requiredPageRole: 'SERVICES_VIEW' },
        },
      ],
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
          path: 'contracts',
          component: ContractsTab,
        },
        {
          path: 'definitions',
          component: DefinitionsView,
        },
        {
          path: 'modules',
          component: HomeView,
        },
      ],
      meta: { role: 'admin' },
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
    {
      path: '/contracts',
      component: ContractsView,
      meta: { requiredPageRole: 'CONTRACT_VIEW' },
    },
    {
      path: '/work-hours',
      component: WorkHoursTab,
      meta: { requiredPageRole: 'WORK_HOURS_VIEW' },
    },
    {
      path: '/orders',
      component: OrdersView,
      children: [
        {
          path: '',
          component: OrdersTab,
          props: { storageKey: 'orders', defaultDepo: '' },
          meta: { requiredPageRole: 'ORDERS_VIEW' },
        },
        {
          path: 'b2b',
          component: OrdersTab,
          props: { storageKey: 'orders-b2b', defaultDepo: 'b2b' },
          meta: { requiredPageRole: 'ORDERS_VIEW' },
        },
        {
          path: 'b2c',
          component: OrdersTab,
          props: { storageKey: 'orders-b2c', defaultDepo: 'b2c' },
          meta: { requiredPageRole: 'ORDERS_VIEW' },
        },
      ],
    },
    {
      path: '/waybills',
      component: WaybillsTab,
      meta: { requiredPageRole: 'WAYBILLS_VIEW' },
    },
    {
      path: '/support',
      component: SupportTab,
    },
    {
      path: '/support/tickets/:ticketId',
      component: TicketPage,
      props: (route) => ({ ticketId: Number(route.params.ticketId) }),
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

  if (to.meta.role && currentUser.value?.role !== to.meta.role) {
    return '/';
  }

  // Check page role requirements
  if (currentUser.value && to.meta.requiredPageRole) {
    // Admins bypass page role checks
    if (currentUser.value.role === 'admin') {
      return;
    }

    // Check if user has the required page role
    const requiredRoleKey = to.meta.requiredPageRole as string;
    const userPageRoleIds = currentUser.value.pageRoles || [];

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
      RECEIVED_ORDER_VIEW: 'received_order_view',
      DISPATCHED_ORDER_VIEW: 'dispatched_order_view',
      CONTRACT_VIEW: 'contract_view',
      STOCKS_VIEW: 'stocks_view',
      SERVICES_VIEW: 'services_view',
      WORK_HOURS_VIEW: 'work_hours_view',
      ORDERS_VIEW: 'orders_view',
      WAYBILL_VIEW: 'waybill_view',
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
