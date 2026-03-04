<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { watchDebounced } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { onMounted, reactive, ref } from 'vue';

import { stateColors, stateDisplayTexts } from '@/constants/ticket';
import { addTicketMessage, setTicketState } from '@/services/api/tickets';
import { useCurrentUserStore } from '@/stores/current-user';
import { useSnackbarStore } from '@/stores/snackbar';
import { useTicketsStore } from '@/stores/tickets';
import { formatDateTime } from '@/utils/formatting';

const props = defineProps<{
  ticketId: number;
}>();

const pagination = reactive({
  page: 1,
  limit: 10,
});

const ticketsStore = useTicketsStore();
const { ticketMessages, totalTicketMessagesCount, currentTicket } = storeToRefs(ticketsStore);

const { currentUser } = storeToRefs(useCurrentUserStore());

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loading = ref(false);
const isSubmitting = ref(false);
const newMessage = ref('');

const roleIconMap: Record<string, string> = {
  admin: 'mdi-headset',
  user: 'mdi-account-outline',
};

const getRoleIcon = (role: string | null | undefined) =>
  role ? (roleIconMap[role] ?? 'mdi-account-outline') : 'mdi-account-outline';

const loadMessages = async () => {
  try {
    loading.value = true;
    await ticketsStore.loadTicketMessages(props.ticketId, pagination);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const submitMessage = async () => {
  if (!newMessage.value.trim()) return;

  try {
    isSubmitting.value = true;
    await addTicketMessage({ ticketId: props.ticketId, message: newMessage.value.trim() });

    if (currentTicket.value?.status === 'completed') {
      currentTicket.value.status = 'reopened';
    }

    newMessage.value = '';
    await loadMessages();
  } catch (error) {
    console.error(error);
    const errorText =
      error instanceof TRPCClientError ? error.message : 'Beklenmeyen bir hata ile karşılaşıldı.';
    snackbarError.value = true;
    snackbarText.value = errorText;
    snackbar.value = true;
  } finally {
    isSubmitting.value = false;
  }
};

watchDebounced(
  pagination,
  async () => {
    await loadMessages();
  },
  { debounce: 300, deep: true },
);

onMounted(async () => {
  await loadMessages();
});

const updateStatus = async (newStatus: 'completed' | 'in_process') => {
  if (currentTicket.value?.status === newStatus) return;

  try {
    await setTicketState(props.ticketId, newStatus);

    if (currentTicket.value) {
      currentTicket.value.status = newStatus;
    }

    snackbarText.value = `Durum "${stateDisplayTexts[newStatus]}" olarak güncellendi.`;
    snackbarError.value = false;
    snackbar.value = true;
  } catch (error) {
    console.error('Status update failed:', error);
    snackbarError.value = true;
    snackbarText.value = 'Durum değiştirilirken bir hata oluştu.';
    snackbar.value = true;
  }
};
</script>

<template>
  <v-container fluid class="pa-4">
    <v-card rounded="lg">
      <!-- Header -->
      <v-card-item class="d-flex">
        <v-card-title class="text-h6 font-weight-bold">
          {{ currentTicket?.title ?? '...' }}
        </v-card-title>
        <v-card-subtitle v-if="currentTicket?.description">
          {{ currentTicket.description }}
        </v-card-subtitle>
        <div></div>
      </v-card-item>

      <v-divider />

      <v-card-text>
        <!-- Loading -->
        <v-row v-if="loading" justify="center" class="py-8">
          <v-progress-circular indeterminate color="primary" size="48" />
        </v-row>

        <!-- Empty -->
        <v-empty-state
          v-else-if="ticketMessages.length === 0"
          icon="mdi-message-off-outline"
          title="Mesaj bulunamadı"
          text="Bu destek talebine ait henüz bir mesaj bulunmamaktadır."
        />

        <!-- Messages -->
        <template v-else>
          <v-row
            v-for="{ ticketMessage, user } in ticketMessages"
            :key="ticketMessage.id"
            :justify="user?.id === currentUser?.id ? 'end' : 'start'"
            class="mb-2"
            no-gutters
          >
            <!-- Other user avatar (left) -->
            <v-col v-if="user?.id !== currentUser?.id" cols="auto" class="mr-2 d-flex align-end">
              <v-avatar color="secondary" size="32">
                <v-icon size="18">{{ getRoleIcon(user?.role) }}</v-icon>
              </v-avatar>
            </v-col>

            <!-- Message bubble -->
            <v-col cols="auto" style="max-width: 70%">
              <div
                class="text-caption text-medium-emphasis mb-1"
                :class="user?.id === currentUser?.id ? 'text-right' : 'text-left'"
              >
                {{ user?.name ?? 'Müşteri' }} · {{ formatDateTime(ticketMessage.creationDate) }}
              </div>
              <v-card
                :color="user?.id === currentUser?.id ? 'primary' : undefined"
                variant="tonal"
                rounded="lg"
              >
                <v-card-text class="text-body-2 py-2 px-3">
                  {{ ticketMessage.message }}
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Current user avatar (right) -->
            <v-col v-if="user?.id === currentUser?.id" cols="auto" class="ml-2 d-flex align-end">
              <v-avatar color="primary" size="32">
                <v-icon size="18">{{ getRoleIcon(user?.role) }}</v-icon>
              </v-avatar>
            </v-col>
          </v-row>
        </template>

        <!-- Pagination -->
        <v-row v-if="totalTicketMessagesCount > pagination.limit" justify="center" class="mt-2">
          <v-col cols="auto">
            <v-pagination
              v-model="pagination.page"
              :length="Math.ceil(totalTicketMessagesCount / pagination.limit)"
              :total-visible="7"
              density="comfortable"
              rounded="circle"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- Reply Box -->
      <v-card-text>
        <v-textarea
          v-model="newMessage"
          @keydown.enter.exact.prevent="submitMessage"
          variant="outlined"
          rounded="lg"
          label="Yanıt yaz..."
          rows="3"
          auto-grow
          hide-details
          :disabled="isSubmitting"
        />
      </v-card-text>

      <v-card-actions class="px-4 pb-4 pt-0">
        <v-menu>
          <template #activator="{ props }">
            <v-chip
              v-if="currentTicket && currentUser?.role === 'admin'"
              v-bind="props"
              :color="stateColors[currentTicket.status]"
              rounded="lg"
              append-icon="mdi-menu-down"
              class="cursor-pointer"
            >
              Durum: {{ stateDisplayTexts[currentTicket.status] }}
            </v-chip>
          </template>

          <v-list>
            <v-list-item
              v-for="state in [
                { value: 'completed', title: 'Tamamlandı' },
                { value: 'in_process', title: 'İşleniyor' },
              ]"
              :key="state.value"
              :value="state.value"
              :active="currentTicket?.status === state.value"
              @click="updateStatus(state.value as 'completed' | 'in_process')"
            >
              <template #prepend>
                <v-icon :color="stateColors[state.value as keyof typeof stateColors]" size="small">
                  {{ state.value === 'completed' ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ state.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-spacer />
        <v-btn
          color="primary"
          rounded="lg"
          prepend-icon="mdi-send"
          :loading="isSubmitting"
          :disabled="!newMessage.trim()"
          @click="submitMessage"
        >
          Gönder
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
