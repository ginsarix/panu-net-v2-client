<script setup lang="ts">
import { motion } from 'motion-v';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { VIconBtn } from 'vuetify/labs/components';

import CompanySection from '@/components/CompanySection.vue';
import GixFooter from '@/components/GixFooter.vue';
import GixSnackbar from '@/components/GixSnackbar.vue';
import NavigationDrawer from '@/components/NavigationDrawer.vue';
import { useCurrentUserStore } from '@/stores/current-user';
import { useDefinitionsStore } from '@/stores/definitions';
import { useDisplayStore } from '@/stores/display';
import { useSnackbarStore } from '@/stores/snackbar';

const currentUserStore = useCurrentUserStore();
const { currentUser } = storeToRefs(currentUserStore);

const displayStore = useDisplayStore();
const { mobile } = storeToRefs(displayStore);

const definitionsStore = useDefinitionsStore();

watch(
  currentUser,
  async (newCurrentUser) => {
    if (!newCurrentUser) return;

    try {
      await definitionsStore.loadCurrentDefinition();
    } catch (error) {
      console.error(error);
    }
  },
  { immediate: true },
);

const router = useRouter();

const rail = ref(true);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarText, snackbarError } = storeToRefs(snackbarStore);

const railToggleIcon = computed(() => (rail.value ? 'mdi-menu-close' : 'mdi-menu-open'));
</script>

<template>
  <v-app>
    <v-layout>
      <NavigationDrawer
        v-if="currentUser"
        :rail="rail"
        @update:rail="rail = $event"
        :mobile="mobile.value"
      />

      <v-app-bar>
        <v-icon-btn
          v-if="currentUser"
          class="mr-3"
          :icon="railToggleIcon"
          @click="rail = !rail"
          aria-label="Navigasyon menüsünü aç"
        />
        <v-app-bar-title @click="router.push('/')" class="cursor-pointer">
          <span class="panu-font">Panu</span
          ><span class="panu-font font-italic" style="color: var(--color-panu)">Net</span>
          <motion.strong
            :animate="{
              boxShadow: [
                'rgba(56, 180, 74, 0.4) 5px 0, rgba(56, 180, 74, 0.3) 10px 0, rgba(56, 180, 74, 0.2) 15px 0, rgba(56, 180, 74, 0.1) 20px 0, rgba(56, 180, 74, 0.05) 25px 0',
                'rgba(56, 180, 74, 0.3) 3px 0, rgba(56, 180, 74, 0.2) 6px 0, rgba(56, 180, 74, 0.15) 9px 0, rgba(56, 180, 74, 0.1) 12px 0, rgba(56, 180, 74, 0.05) 15px 0',
                'rgba(56, 180, 74, 0.4) 5px 0, rgba(56, 180, 74, 0.3) 10px 0, rgba(56, 180, 74, 0.2) 15px 0, rgba(56, 180, 74, 0.1) 20px 0, rgba(56, 180, 74, 0.05) 25px 0',
              ],
            }"
            :transition="{
              duration: 5,
              repeat: Infinity,
              // asymmetric breathing effect
              ease: [0.45, 0, 0.55, 1.2],
              times: [0, 0.4, 1],
            }"
            class="pa-2 rounded-pill"
          >
            V2
          </motion.strong>
        </v-app-bar-title>

        <CompanySection :mobile="mobile.value" v-if="currentUser && !mobile.value" />
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
