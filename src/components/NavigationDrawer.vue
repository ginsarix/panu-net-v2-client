<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import RoleIconsInfo from '@/components/RoleIconsInfo.vue';
import { useCurrentUserStore } from '@/stores/current-user';

defineProps<{
  rail: boolean;
}>();

defineEmits<{
  (e: 'update:rail'): void;
}>();

const router = useRouter();

const currentUserStore = useCurrentUserStore();
const { currentUser } = storeToRefs(currentUserStore);
const dialog = ref(false);

onMounted(async () => {
  try {
    await currentUserStore.loadCurrentUser();

    if (!currentUser) await router.push('/login');
  } catch (error) {
    console.error('Error occurred during getting login details :', error);
  }
});
const userIcon = computed(() => (currentUser.value?.role === 'admin' ? 'mdi-key' : 'mdi-account'));

const loginout = async () => {
  if (currentUser) await currentUserStore.logoutCurrentUser();
  await router.push('/login');
};
</script>

<template>
  <v-navigation-drawer
    :class="'position-fixed ' + (rail ? '' : 'pa-2')"
    location="left"
    :rail="rail"
    permanent
  >
    <v-list class="pa-2">
      <v-list-item :prepend-icon="userIcon" :title="currentUser?.name" nav>
        <template #append>
          <v-btn
            style="opacity: 60%"
            variant="text"
            id="role-info-activator"
            size="small"
            icon="mdi-information-outline"
            aria-label="Rol ikonları bilgi menüsünü aç"
            @click="dialog = true"
          />
          <v-tooltip :text="`${currentUser ? 'Çıkış' : 'Giriş'} Yap`" location="bottom">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                @click="loginout"
                variant="text"
                size="small"
                :icon="currentUser ? 'mdi-logout' : 'mdi-login'"
                :aria-label="`${currentUser ? 'Çıkış' : 'Giriş'} Yap`"
              />
            </template>
          </v-tooltip>
        </template>
      </v-list-item>
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

      <v-list-group value="Stock">
        <template #activator="{ props }">
          <v-list-item v-bind="props" rounded="xl" prepend-icon="mdi-cube" title="Stok" />
        </template>

        <v-list-item rounded="xl" prepend-icon="mdi-truck" to="/stock/moving-stock">
          <v-list-item-title
            >Hareket <br />
            Görenler
          </v-list-item-title>
        </v-list-item>
        <v-list-item rounded="xl" prepend-icon="mdi-clock" to="/stock/idle-stock">
          <v-list-item-title
            >Hareket <br />
            Görmeyenler
          </v-list-item-title>
        </v-list-item>
        <v-list-item rounded="xl" prepend-icon="mdi-chart-line" to="/stock/stock-profitability">
          <v-list-item-title
            >Stok Bazlı <br />
            Karlılık
          </v-list-item-title>
        </v-list-item>
        <v-list-item
          rounded="xl"
          prepend-icon="mdi-cube-outline"
          title="Fiili Stok"
          to="/stock/physical-stock"
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

      <v-list-group value="Management">
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
    </v-list>
  </v-navigation-drawer>

  <RoleIconsInfo activator="#role-info-activator" />
</template>
