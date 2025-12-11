<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import { usePageRoleAccess } from '@/composables/usePageRoleAccess';
import { useCurrentUserStore } from '@/stores/current-user';
import { useDefinitionsStore } from '@/stores/definitions';
import { usePageRolesStore } from '@/stores/page-roles';

import CompanySection from './CompanySection.vue';
import UserProfile from './UserProfile.vue';

const props = defineProps<{
  rail: boolean;
  mobile: boolean;
}>();

defineEmits<{
  (e: 'update:rail', value: boolean): void;
}>();

const currentUserStore = useCurrentUserStore();
const { currentUser } = storeToRefs(currentUserStore);

const pageRolesStore = usePageRolesStore();
const { hasPageRole, isAdmin } = usePageRoleAccess();

const definitionsStore = useDefinitionsStore();
const { currentDefinition } = storeToRefs(definitionsStore);

onMounted(async () => {
  try {
    await currentUserStore.loadCurrentUser();
    await pageRolesStore.loadPageRoles();
  } catch (error) {
    console.error('Error occurred during getting login details :', error);
  }
});

const companySectionVisible = ref(false);
const railToggleIcon = computed(() => (props.rail ? 'mdi-menu-close' : 'mdi-menu-open'));

const permanent = ref(true);

watch(
  () => [props.mobile, props.rail],
  ([newMobile, newRail]) => {
    // if screen is mobile and the drawer isn't open, completely hide the drawer
    if (newMobile && newRail) {
      permanent.value = false;
    } else {
      // if screen is desktop or the drawer is open, make the drawer permanent
      permanent.value = true;
    }
  },
  { immediate: true },
);
</script>

<template>
  <v-navigation-drawer
    :style="{ ...(mobile && !rail && { width: '100vh' }) }"
    class="position-fixed"
    :class="{ 'pa-2': !rail }"
    :rail
    :permanent
  >
    <v-list class="pa-2">
      <v-list-item class="ps-0" :title="currentUser?.name" nav>
        <template #prepend>
          <UserProfile />
        </template>
        <template #append>
          <template v-if="mobile">
            <v-btn
              aria-label="Ayarlar"
              @click="companySectionVisible = !companySectionVisible"
              icon="mdi-cog"
              variant="text"
              size="small"
            />
            <v-btn
              class="mr-3"
              :icon="railToggleIcon"
              @click="$emit('update:rail', !rail)"
              aria-label="Navigasyon menüsünü aç"
            />
          </template>
        </template>
      </v-list-item>
      <template v-if="mobile">
        <v-expand-transition v-show="companySectionVisible">
          <div>
            <CompanySection :mobile class="text-center" />
          </div>
        </v-expand-transition>
      </template>
    </v-list>
    <v-divider />
    <v-list>
      <v-list-item rounded="xl" prepend-icon="mdi-view-dashboard" title="Panel" to="/" />
    </v-list>

    <v-list @click:open="$emit('update:rail', mobile)">
      <!-- if mobile, close the drawer on navigation otherwise open it -->
      <v-list-group
        v-if="hasPageRole('STOCKS_VIEW') || hasPageRole('SERVICES_VIEW')"
        value="Stocks"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" rounded="xl" prepend-icon="mdi-warehouse" title="Stok" />
        </template>
        <v-list-item
          v-if="hasPageRole('STOCKS_VIEW')"
          rounded="xl"
          prepend-icon="mdi-view-list"
          title="Stok Listesi"
          to="/stocks/list"
        />
        <v-list-item
          v-if="hasPageRole('SERVICES_VIEW')"
          rounded="xl"
          prepend-icon="mdi-briefcase"
          title="Hizmetler"
          to="/stocks/service-list"
        />
      </v-list-group>
      <v-list-group
        v-if="hasPageRole('DEBTOR_VIEW') || hasPageRole('CREDITOR_VIEW')"
        value="DebtorCreditors"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            rounded="xl"
            prepend-icon="mdi-account-credit-card"
            title="Cari"
          />
        </template>
        <v-list-item
          v-if="hasPageRole('DEBTOR_VIEW')"
          rounded="xl"
          prepend-icon="mdi-bank-transfer-out"
          title="Borçlular"
          to="/dbcr/debtors"
        />
        <v-list-item
          v-if="hasPageRole('CREDITOR_VIEW')"
          rounded="xl"
          prepend-icon="mdi-bank-transfer-in"
          title="Alacaklılar"
          to="/dbcr/creditors"
        />
      </v-list-group>

      <!-- <v-list-group value="Orders">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            rounded="xl"
            prepend-icon="mdi-clipboard"
            title="Siparişler"
          />
        </template>

        <v-list-item rounded="xl" prepend-icon="mdi-email-arrow-left" to="/orders/received-orders">
          <v-list-item-title>
            Alınan
            <br />
            Siparişler
          </v-list-item-title>
        </v-list-item>
        <v-list-item rounded="xl" prepend-icon="mdi-dolly" to="/orders/dispatched-orders">
          <v-list-item-title>
            Sevk
            <br />
            Edilenler
          </v-list-item-title>
        </v-list-item>
      </v-list-group> -->

      <v-list-group
        v-if="hasPageRole('SUBSCRIPTION_VIEW') || hasPageRole('CUSTOMER_VIEW')"
        value="TaskTracking"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            rounded="xl"
            prepend-icon="mdi-table-network"
            title="Görev Takibi"
          />
        </template>

        <v-list-item
          v-if="hasPageRole('SUBSCRIPTION_VIEW')"
          rounded="xl"
          prepend-icon="mdi-cash-multiple"
          title="Abonelikler"
          to="/task-tracking/subscriptions"
        />
        <v-list-item
          v-if="hasPageRole('CUSTOMER_VIEW')"
          rounded="xl"
          prepend-icon="mdi-account-cash"
          title="Müşteriler"
          to="/task-tracking/customers"
        />
      </v-list-group>

      <v-list-group v-if="isAdmin" value="Management">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            rounded="xl"
            prepend-icon="mdi-card-bulleted-settings"
            title="Yönetim"
          />
        </template>
        <v-list-item
          rounded="xl"
          prepend-icon="mdi-domain"
          title="Firmalar"
          to="/management/companies"
        />
        <v-list-item
          rounded="xl"
          prepend-icon="mdi-account-group"
          title="Kullanıcılar"
          to="/management/users"
        />
        <v-list-item
          rounded="xl"
          prepend-icon="mdi-file-document"
          title="Sözleşmeler"
          to="/management/contracts"
        />
        <v-list-item
          rounded="xl"
          prepend-icon="mdi-format-list-bulleted"
          title="Tanımlar"
          to="/management/definitions"
        />
        <v-list-item
          rounded="xl"
          prepend-icon="mdi-view-module"
          title="Modüller"
          to="/management/modules"
        />
      </v-list-group>
      <v-list-group v-if="hasPageRole('REPORT_VIEW')" value="Reports">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            rounded="xl"
            prepend-icon="mdi-file-document-multiple"
            title="Raporlar"
          />
        </template>

        <v-list-item
          rounded="xl"
          prepend-icon="mdi-file-document"
          title="Genel Rapor"
          to="/reports/general-report"
        />
      </v-list-group>
      <v-list-item
        v-if="hasPageRole('CONTRACT_VIEW')"
        rounded="xl"
        prepend-icon="mdi-file-document-outline"
        title="Sözleşmeler"
        to="/contracts"
      />
      <v-list-item
        rounded="xl"
        prepend-icon="mdi-credit-card-outline"
        title="Ödeme"
        :href="currentDefinition?.paymentLink || ''"
        target="_blank"
      />
    </v-list>
  </v-navigation-drawer>
</template>
