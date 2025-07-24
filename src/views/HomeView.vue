<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import AnalyticsTab from '@/components/DebtorsCreditors/AnalyticsTab.vue';
import { useSelectedCompany } from '@/composables/useSelectedCompany';
import { useCompaniesStore } from '@/stores/companies';
import { useCreditorsStore } from '@/stores/creditors';
import { useDebtorsStore } from '@/stores/debtors';
import { useUsersStore } from '@/stores/users';

const companiesStore = useCompaniesStore();
const usersStore = useUsersStore();
const debtorsStore = useDebtorsStore();
const creditorsStore = useCreditorsStore();

const mounting = ref(false);
const { selectedCompany, loading } = useSelectedCompany();
const allLoaded = computed(() => !mounting.value && !loading.value);

onMounted(async () => {
  loading.value = true;
  await Promise.all([companiesStore.loadCompanies(), usersStore.loadUsers()]);
  loading.value = false;
});

watch(selectedCompany, async (newValue) => {
  if (!newValue) return;

  const companyParams = { companyCode: newValue.code, periodCode: newValue.period };

  await Promise.all([
    debtorsStore.loadDebtors(companyParams),
    creditorsStore.loadCreditors(companyParams),
  ]);
});

const totalCompanies = computed(() => companiesStore.companies.length);
const totalUsers = computed(() => usersStore.users.length);
const totalDebtors = computed(() => debtorsStore.debtors.length);
const totalCreditors = computed(() => creditorsStore.creditors.length);

const kpis = [
  { label: 'Şirketler', value: totalCompanies, icon: 'mdi-domain', theme: 'primary' },
  { label: 'Kullanıcılar', value: totalUsers, icon: 'mdi-account-group', theme: 'info' },
  {
    label: 'Borçlular',
    value: totalDebtors,
    icon: 'mdi-bank-transfer-out',
    theme: 'error',
  },
  {
    label: 'Alacaklılar',
    value: totalCreditors,
    icon: 'mdi-bank-transfer-in',
    theme: 'success',
  },
];

const quickLinks = [
  { label: 'Şirketler', icon: 'mdi-domain', to: '/management/companies', theme: 'primary' },
  { label: 'Kullanıcılar', icon: 'mdi-account-group', to: '/management/users', theme: 'info' },
  { label: 'Borçlular', icon: 'mdi-bank-transfer-out', to: '/dbcr/debtors', theme: 'error' },
  { label: 'Alacaklılar', icon: 'mdi-bank-transfer-in', to: '/dbcr/creditors', theme: 'success' },
];
</script>

<template>
  <v-container fluid class="dashboard-bg py-8">
    <v-row class="mb-8" align="center" justify="center">
      <v-col cols="12" md="3" v-for="kpi in kpis" :key="kpi.label">
        <v-card :color="kpi.theme" class="kpi-card text-center py-6" elevation="8">
          <v-icon :icon="kpi.icon" size="48" class="mb-2" />
          <div class="kpi-value">
            <span v-if="allLoaded">{{ kpi.value }}</span>
            <template v-else>
              <v-progress-circular indeterminate />
            </template>
          </div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-8" align="center" justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-4 analytics-card" elevation="10">
          <AnalyticsTab :loading="!allLoaded" />
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-6 quick-links-card" elevation="10">
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
      </v-col>
    </v-row>

    <v-row align="center" justify="center">
      <v-col cols="12" md="10">
        <v-alert type="info" class="elevation-2 text-center py-6" border="start">
          <span class="text-h5 font-weight-bold">PanuNet V2</span> — Modern, hızlı ve "think simple!
        </v-alert>
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
