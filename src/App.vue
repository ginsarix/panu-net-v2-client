<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { VIconBtn } from 'vuetify/labs/components';

import CompanySelect from '@/components/CompanySelect.vue';
import GixFooter from '@/components/GixFooter.vue';
import GixSnackbar from '@/components/GixSnackbar.vue';
import NavigationDrawer from '@/components/NavigationDrawer.vue';
import { useSnackbarStore } from '@/stores/snackbar.ts';

import { useCurrentUserStore } from './stores/current-user';

const currentUserStore = useCurrentUserStore();
const { currentUser } = storeToRefs(currentUserStore);

const router = useRouter();

const rail = ref(true);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarText, snackbarError } = storeToRefs(snackbarStore);
</script>

<template>
  <v-app>
    <v-layout>
      <NavigationDrawer v-if="currentUser" :rail="rail" @update:rail="rail = false" />

      <v-app-bar>
        <v-icon-btn
          v-if="currentUser"
          class="mr-3"
          :icon="rail ? 'mdi-menu-close' : 'mdi-menu-open'"
          @click="rail = !rail"
          aria-label="Navigasyon menüsünü aç"
        />
        <v-app-bar-title @click="router.push('/')" class="cursor-pointer">
          <span class="panu-font">Panu</span
          ><span class="panu-font font-italic" style="color: var(--color-panu)">Net</span>
          <strong class="pa-2 rounded-pill version-text">V2</strong>
        </v-app-bar-title>

        <v-spacer />

        <CompanySelect v-if="currentUser" />
      </v-app-bar>
      <v-main>
        <v-container>
          <router-view />
          <GixSnackbar
            v-model:snackbar="snackbar"
            v-model:text="snackbarText"
            v-model:error="snackbarError"
          />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
  <GixFooter />
</template>

<style scoped>
.version-text {
  box-shadow:
    rgba(56, 180, 74, 0.4) 5px 0,
    rgba(56, 180, 74, 0.3) 10px 0,
    rgba(56, 180, 74, 0.2) 15px 0,
    rgba(56, 180, 74, 0.1) 20px 0,
    rgba(56, 180, 74, 0.05) 25px 0;
}
</style>
