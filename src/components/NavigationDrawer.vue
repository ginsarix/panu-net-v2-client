<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useCurrentUserStore } from '@/stores/current-user';

import CompanySection from './CompanySection.vue';

defineProps<{
  rail: boolean;
  mobile: boolean;
}>();

defineEmits<{
  (e: 'update:rail'): void;
}>();

const router = useRouter();

const currentUserStore = useCurrentUserStore();
const { currentUser } = storeToRefs(currentUserStore);

onMounted(async () => {
  try {
    await currentUserStore.loadCurrentUser();

    if (!currentUser) await router.push('/login');
  } catch (error) {
    console.error('Error occurred during getting login details :', error);
  }
});
const userIcon = computed(() => (currentUser.value?.role === 'admin' ? 'mdi-key' : 'mdi-account'));

const logout = async () => {
  if (currentUser) await currentUserStore.logoutCurrentUser();
  await router.push('/login');
};

const companySectionVisible = ref(false);
</script>

<template>
  <v-navigation-drawer
    :class="'position-fixed' + (rail ? '' : ' pa-2')"
    :location="!mobile ? 'left' : 'bottom'"
    :rail
    permanent
  >
    <v-list class="pa-2">
      <v-list-item :prepend-icon="userIcon" :title="currentUser?.name" nav>
        <template #append>
          <v-btn
            v-if="mobile"
            aria-label="Ayarlar"
            @click="companySectionVisible = !companySectionVisible"
            icon="mdi-cog"
            variant="text"
            size="small"
          />
          <v-tooltip :text="`${currentUser ? 'Çıkış' : 'Giriş'} Yap`" location="bottom">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                @click="logout"
                variant="text"
                size="small"
                :icon="currentUser ? 'mdi-logout' : 'mdi-login'"
                :aria-label="`${currentUser ? 'Çıkış' : 'Giriş'} Yap`"
              />
            </template>
          </v-tooltip>
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

    <v-list @click:open="$emit('update:rail')">
      <v-list-group value="DebtorCreditors">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            rounded="xl"
            prepend-icon="mdi-account-credit-card"
            title="Cari"
          />
        </template>
        <v-list-item
          rounded="xl"
          prepend-icon="mdi-bank-transfer-out"
          title="Borçlular"
          to="/dbcr/debtors"
        />
        <v-list-item
          rounded="xl"
          prepend-icon="mdi-bank-transfer-in"
          title="Alacaklılar"
          to="/dbcr/creditors"
        />
      </v-list-group>

      <v-list-group value="Orders">
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
      </v-list-group>

      <v-list-group value="TaskTracking">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            rounded="xl"
            prepend-icon="mdi-table-network"
            title="Görev Takibi"
          />
        </template>

        <v-list-item
          rounded="xl"
          prepend-icon="mdi-cash-multiple"
          title="Abonelikler"
          to="/task-tracking/subscriptions"
        />
        <v-list-item
          v-if="currentUser?.role === 'admin'"
          rounded="xl"
          prepend-icon="mdi-account-cash"
          title="Müşteriler"
          to="/task-tracking/customers"
        />
      </v-list-group>

      <v-list-group v-if="currentUser?.role === 'admin'" value="Management">
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
          prepend-icon="mdi-view-module"
          title="Modüller"
          to="/management/modules"
        />
      </v-list-group>
      <v-list-group value="Reports">
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
    </v-list>
  </v-navigation-drawer>
</template>
