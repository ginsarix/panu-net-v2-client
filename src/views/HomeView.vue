<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';

import AnalyticsTab from '@/components/DebtorsCreditors/AnalyticsTab.vue';
import { usePageRoleAccess } from '@/composables/usePageRoleAccess';
import { useSelectedCompany } from '@/composables/useSelectedCompany';
import { useCompaniesStore } from '@/stores/companies';
import { useCreditorsStore } from '@/stores/creditors';
import { useDebtorsStore } from '@/stores/debtors';
import { usePageRolesStore } from '@/stores/page-roles';
import { useUsersStore } from '@/stores/users';

const companiesStore = useCompaniesStore();
const usersStore = useUsersStore();

const pageRolesStore = usePageRolesStore();
const { hasPageRole, isAdmin } = usePageRoleAccess();

onMounted(async () => {
  await pageRolesStore.loadPageRoles();
  if (!totalCompanies.value) await loadCompanies();
  if (!totalUsers.value) await loadUsers();
});

const loadCompanies = async () => {
  try {
    await companiesStore.loadCompanies();
  } catch (error) {
    console.error(error);
  }
};

const loadUsers = async () => {
  try {
    await usersStore.loadUsers();
  } catch (error) {
    console.error(error);
  }
};

const debtorsStore = useDebtorsStore();
const creditorsStore = useCreditorsStore();

const { selectedPeriodCode } = storeToRefs(companiesStore);

const { selectedCompany, loading } = useSelectedCompany();

const loadCreditors = async () => {
  if (!selectedCompany.value) return;

  try {
    await creditorsStore.loadCreditors();
  } catch (error) {
    console.error(error);
  }
};

const loadDebtors = async () => {
  if (!selectedCompany.value) return;

  try {
    await debtorsStore.loadDebtors();
  } catch (error) {
    console.error(error);
  }
};

watch(
  [selectedCompany, selectedPeriodCode],
  async ([newSelectedCompany, newSelectedPeriod]) => {
    if (newSelectedCompany && newSelectedPeriod !== null && newSelectedPeriod !== undefined) {
      loading.value = true;
      const loadPromises = [];

      if (hasPageRole('DEBTOR_VIEW')) {
        loadPromises.push(loadDebtors());
      }

      if (hasPageRole('CREDITOR_VIEW')) {
        loadPromises.push(loadCreditors());
      }

      await Promise.all(loadPromises);
      loading.value = false;
    }
  },
  { immediate: true },
);

const totalCompanies = computed(() => companiesStore.companies.length);
const totalUsers = computed(() => usersStore.users.length);
const totalDebtors = computed(() => debtorsStore.debtors.length);
const totalCreditors = computed(() => creditorsStore.creditors.length);

const baseKpis = computed(() => {
  const kpis = [];

  // Always show companies for admins
  if (isAdmin.value) {
    kpis.push({ label: 'Firmalar', value: totalCompanies, icon: 'mdi-domain', theme: 'primary' });
  }

  // Show debtors if user has access
  if (hasPageRole('DEBTOR_VIEW')) {
    kpis.push({
      label: 'Borçlular',
      value: totalDebtors,
      icon: 'mdi-bank-transfer-out',
      theme: 'error',
    });
  }

  // Show creditors if user has access
  if (hasPageRole('CREDITOR_VIEW')) {
    kpis.push({
      label: 'Alacaklılar',
      value: totalCreditors,
      icon: 'mdi-bank-transfer-in',
      theme: 'success',
    });
  }

  return kpis;
});

const adminKpis = [
  { label: 'Kullanıcılar', value: totalUsers, icon: 'mdi-account-group', theme: 'info' },
];

const kpis = computed(() =>
  isAdmin.value
    ? [...baseKpis.value.slice(0, 1), ...adminKpis, ...baseKpis.value.slice(1)]
    : baseKpis.value,
);

const baseLinks = computed(() => {
  const links = [];

  if (hasPageRole('DEBTOR_VIEW')) {
    links.push({
      label: 'Borçlular',
      icon: 'mdi-bank-transfer-out',
      to: '/dbcr/debtors',
      theme: 'error',
    });
  }

  if (hasPageRole('CREDITOR_VIEW')) {
    links.push({
      label: 'Alacaklılar',
      icon: 'mdi-bank-transfer-in',
      to: '/dbcr/creditors',
      theme: 'success',
    });
  }

  if (hasPageRole('REPORT_VIEW')) {
    links.push({
      label: 'Genel Rapor',
      icon: 'mdi-file-document',
      to: '/reports/general-report',
      theme: 'primary',
    });
  }

  return links;
});

const adminLinks = [
  { label: 'Kullanıcılar', icon: 'mdi-account-group', to: '/management/users', theme: 'info' },
  { label: 'Firmalar', icon: 'mdi-domain', to: '/management/companies', theme: 'primary' },
];

const quickLinks = computed(() =>
  isAdmin.value ? [...baseLinks.value, ...adminLinks] : baseLinks.value,
);
</script>

<template>
  <v-container fluid class="dashboard-bg py-8">
    <v-row class="mb-8" align="center" justify="center">
      <v-col cols="12" md="3" v-for="kpi in kpis" :key="kpi.label">
        <v-card :color="kpi.theme" class="kpi-card text-center py-6" elevation="8">
          <v-icon :icon="kpi.icon" size="48" class="mb-2" />
          <div class="kpi-value">
            <span v-if="!loading">{{ kpi.value }}</span>
            <template v-else>
              <v-progress-circular indeterminate />
            </template>
          </div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-8" align="center" justify="center">
      <v-col v-if="hasPageRole('DEBTOR_VIEW') && hasPageRole('CREDITOR_VIEW')" cols="12" md="8">
        <v-card class="pa-4 analytics-card" elevation="10">
          <AnalyticsTab :loading />
        </v-card>
      </v-col>
      <v-col
        :cols="hasPageRole('DEBTOR_VIEW') || hasPageRole('CREDITOR_VIEW') ? 12 : 12"
        :md="hasPageRole('DEBTOR_VIEW') || hasPageRole('CREDITOR_VIEW') ? 4 : 8"
        :class="hasPageRole('DEBTOR_VIEW') || hasPageRole('CREDITOR_VIEW') ? '' : 'offset-md-2'"
      >
        <v-card v-if="quickLinks.length > 0" class="pa-6 quick-links-card" elevation="10">
          <div class="text-h6 mb-4">Hızlı Erişim</div>
          <v-list rounded="lg" class="pa-2">
            <v-list-item
              v-for="link in quickLinks"
              :key="link.label"
              :to="link.to"
              class="quick-link-item"
              rounded="xl"
              append-icon="mdi-chevron-right"
            >
              <v-list-item-media>
                <v-icon :icon="link.icon" size="32" :class="`text-${link.theme}`" />
              </v-list-item-media>
              <v-list-item-title class="font-weight-bold">{{ link.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
        <h1 class="font-weight-black text-underline text-h4" v-else>
          Hiçbir modüle erişiminiz yok.
        </h1>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.dashboard-bg {
  min-height: 100vh;
}
.kpi-card {
  border-radius: 2rem;
  color: white;
  font-size: 1.2rem;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  transition: transform 0.2s;
}
.kpi-card:hover {
  transform: scale(1.04);
  box-shadow: 0 16px 40px 0 rgba(31, 38, 135, 0.18);
}
.kpi-value {
  font-size: 2.8rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.kpi-label {
  font-size: 1.1rem;
  opacity: 0.85;
}
.analytics-card {
  border-radius: 2rem;
}
.quick-links-card {
  border-radius: 2rem;
  background: var(--v-theme-surface);
}
.quick-link-item {
  cursor: pointer;
  transition: background 0.2s;
}
.quick-link-item:hover {
  background: var(--v-theme-surface-variant);
}
</style>
