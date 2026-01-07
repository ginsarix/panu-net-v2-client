<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import PasswordChange from '@/components/PasswordChange.vue';
import { useCurrentUserStore } from '@/stores/current-user';
import { formatDateTime } from '@/utils/formatting';

const currentUserStore = useCurrentUserStore();
const { currentUser } = storeToRefs(currentUserStore);
const userIcon = computed(() => (currentUser.value?.role === 'admin' ? 'mdi-key' : 'mdi-account'));
const showPasswordChangeForm = ref(false);

const router = useRouter();

const logout = async () => {
  if (currentUser) await currentUserStore.logoutCurrentUser();
  await router.push('/login');
};
</script>

<template>
  <v-dialog max-width="500">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :icon="userIcon"
        color="medium-emphasis"
        class="me-2"
        variant="outlined"
        border="sm"
        size="40"
      />
    </template>
    <template #default="{ isActive }">
      <v-card rounded="lg" class="pa-6 elevation-10" v-if="currentUser">
        <v-row class="mb-4 justify-center">
          <v-avatar color="primary" size="80">
            <span class="text-h3 text-white">
              {{ currentUser.name?.[0]?.toUpperCase() }}
            </span>
          </v-avatar>
        </v-row>
        <v-row class="justify-center mb-3">
          <v-col cols="12" class="text-center">
            <div class="text-h5 font-weight-bold">{{ currentUser.name }}</div>
            <div class="text-subtitle-2 text-grey-darken-1">
              {{ currentUser.role === 'admin' ? 'Yönetici' : 'Kullanıcı' }}
            </div>
          </v-col>
        </v-row>
        <v-divider class="mb-4" />
        <v-list density="compact">
          <v-list-item>
            <v-list-item-title>
              <v-icon start icon="mdi-email" class="mr-2 text-primary"></v-icon>
              {{ currentUser.email }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item v-if="currentUser.phone">
            <v-list-item-title>
              <v-icon start icon="mdi-phone" class="mr-2 text-primary"></v-icon>
              {{ currentUser.phone || '-' }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>
              <v-icon start icon="mdi-calendar" class="mr-2 text-primary"></v-icon>
              Oluşturulma Tarihi:
              <span class="font-weight-medium ml-1" v-if="currentUser.creationDate">
                {{ formatDateTime(currentUser.creationDate, 'dd.MM.yyyy') }}
              </span>
            </v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>
              <v-btn
                prepend-icon="mdi-lock-reset"
                text="Şifreni değiştir"
                rounded="lg"
                class="mb-3"
                :append-icon="showPasswordChangeForm ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                @click="showPasswordChangeForm = !showPasswordChangeForm"
                variant="outlined"
                border="sm"
              />
            </v-list-item-title>
            <v-expand-transition v-show="showPasswordChangeForm">
              <v-container class="pa-0">
                <PasswordChange />
              </v-container>
            </v-expand-transition>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-btn
            @click="logout"
            append-icon="mdi-logout"
            rounded="lg"
            class="text-capitalize"
            text="Çıkış Yap"
          />
          <v-spacer />

          <v-btn @click="isActive.value = false" rounded="lg" text="Tamam" />
        </v-card-actions>
      </v-card>
      <v-card v-else class="pa-6 elevation-10 d-flex align-center justify-center" height="300">
        <v-progress-circular indeterminate color="primary" size="44" />
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped></style>
