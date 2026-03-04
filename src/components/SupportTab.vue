<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { watchDebounced } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { VIconBtn } from 'vuetify/labs/VIconBtn';

import {
  priorityColors,
  priorityDisplayTexts,
  prioritySelectList,
  stateColors,
  stateDisplayTexts,
  stateSelectList,
} from '@/constants/ticket';
import { type GetTicketsParams, deleteTicket, openTicket } from '@/services/api/tickets';
import { useCurrentUserStore } from '@/stores/current-user';
import { useDisplayStore } from '@/stores/display';
import { useSnackbarStore } from '@/stores/snackbar';
import { useTicketsStore } from '@/stores/tickets';
import { ActionMode } from '@/types/action-mode';
import { noEmptyRule } from '@/types/validations';
import { formatDateTime } from '@/utils/formatting';

const pagination = reactive({
  page: 1,
  limit: 10,
});

const filters = reactive({
  state: null,
  priority: null,
  search: '',
});

// make sure to manually add each key as a slot to the table since the ticket is nested in the response
const headers = [
  { title: 'ID', key: 'id', sortable: false },
  { title: 'Başlık', key: 'title', sortable: true },
  { title: 'Durum', key: 'ticketState', sortable: true },
  { title: 'Öncelik', key: 'priority', sortable: true },
  { title: 'Ekleyen Kullanıcı', key: 'user', sortable: true },
  { title: 'Oluşturulma Tarihi', key: 'creationDate', sortable: true },
  { title: 'Eylemler', key: 'actions', sortable: false },
];

const ticketsStore = useTicketsStore();
const { tickets, totalTicketsCount } = storeToRefs(ticketsStore);
const { mobile } = storeToRefs(useDisplayStore());
const loading = ref(false);

const currentUserStore = useCurrentUserStore();
const { currentUser } = storeToRefs(currentUserStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loadTickets = async (options?: GetTicketsParams) => {
  try {
    loading.value = true;
    await ticketsStore.loadTickets(options);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

watchDebounced(
  [pagination, filters],
  async ([newPagination, newFilters]) => {
    await loadTickets({ ...newPagination, ...newFilters });
  },
  { debounce: 300, deep: true },
);

onMounted(async () => {
  await loadTickets(pagination);
});

type Rule = (v: unknown) => true | string;
type TicketForm = {
  title: { value: string; rules: Rule[] };
  description: { value: string; rules: Rule[] };
  priority: { value: 'low' | 'medium' | 'high' | 'urgent'; rules: Rule[] };
};

const ticketForm = reactive<TicketForm>({
  title: { value: '', rules: [noEmptyRule] },
  description: { value: '', rules: [] },
  priority: { value: 'medium', rules: [noEmptyRule] },
});

const resetForm = () => {
  for (const field in ticketForm) {
    ticketForm[field as keyof typeof ticketForm].value = field === 'priority' ? 'medium' : '';
  }
};

const selectedTicket = ref<number | null>(null);

const currentMode = ref(ActionMode.Idle);
const showCrudDialog = ref(false);

watch(showCrudDialog, (newValue) => {
  if (!newValue && currentMode.value !== ActionMode.Idle) {
    currentMode.value = ActionMode.Idle;
  }
});

watch(currentMode, (newValue) => {
  if (newValue === ActionMode.Idle) {
    showCrudDialog.value = false;
    resetForm();
  } else if (newValue === ActionMode.Create || newValue === ActionMode.Delete) {
    showCrudDialog.value = true;
    resetForm();
  }
});

const isSubmitting = ref(false);

const dialogSubmit = async () => {
  isSubmitting.value = true;
  try {
    switch (currentMode.value) {
      case ActionMode.Create:
        const ticket = {
          title: ticketForm.title.value,
          description: ticketForm.description.value,
          priority: ticketForm.priority.value,
        };

        const openResponse = await openTicket(ticket);

        ticketsStore.addTicketToList(
          {
            ticket: openResponse.createdTicket,
            user: { id: currentUser.value!.id!, name: currentUser.value!.name },
          },
          true,
        );

        break;
      case ActionMode.Delete:
        const ticketId = selectedTicket.value;
        if (!ticketId) return;

        const deleteResponse = await deleteTicket(ticketId);

        snackbarError.value = false;
        snackbarText.value = deleteResponse.message;
        snackbar.value = true;

        ticketsStore.removeTicketById(ticketId);
        break;
      case ActionMode.Idle: {
        throw new Error('Not implemented yet: ActionMode.Idle case');
      }
      default:
        break;
    }
  } catch (error) {
    console.error(error);

    const errorText =
      error instanceof TRPCClientError ? error.message : 'Beklenmeyen bir hata ile karşılaşıldı.';

    snackbarError.value = true;
    snackbarText.value = errorText;
    snackbar.value = true;
  } finally {
    isSubmitting.value = false;
    currentMode.value = ActionMode.Idle;
  }
};

const validateField = (field: (typeof ticketForm)[keyof typeof ticketForm]) =>
  //                                             fuck you typescript
  field.rules.every((rule) => rule(field.value as never) === true);

const formValid = computed(() => Object.values(ticketForm).every((field) => validateField(field)));
</script>

<template>
  <v-container fluid>
    <v-card rounded="lg">
      <v-card-title class="text-h5 font-weight-bold"> Destek Talepleri </v-card-title>

      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6" md="3">
            <v-select
              rounded="lg"
              v-model="filters.state"
              :items="stateSelectList"
              label="Durum"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              rounded="lg"
              v-model="filters.priority"
              :items="prioritySelectList"
              label="Öncelik"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              rounded="lg"
              v-model="filters.search"
              label="Başlık Ara..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              @click="currentMode = ActionMode.Create"
              rounded="lg"
              class="w-100 h-sm-100"
              color="primary"
              prepend-icon="mdi-plus"
            >
              Destek Talebi Oluştur
            </v-btn>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <v-data-table-server
          v-model:items-per-page="pagination.limit"
          v-model:page="pagination.page"
          :items-length="totalTicketsCount"
          :items="tickets"
          :headers="headers"
          :loading="loading"
          :mobile="mobile.value"
          no-data-text="Destek talepleri bulunamadı."
          fixed-header
          hover
          item-value="id"
          items-per-page-text="Sayfa başı destek talepleri"
          :items-per-page-options="[10, 25, 50, 100]"
        >
          <template #[`item.id`]="{ item }">
            {{ item.ticket.id }}
          </template>
          <template #[`item.title`]="{ item }">
            <router-link
              :to="`/support/tickets/${item.ticket.id}`"
              class="text-primary font-weight-medium"
            >
              {{ item.ticket.title }}
            </router-link>
          </template>

          <template #[`item.ticketState`]="{ item }">
            <v-chip :color="stateColors[item.ticket.ticketState]" variant="flat" size="small" label>
              {{ stateDisplayTexts[item.ticket.ticketState] }}
            </v-chip>
          </template>

          <template #[`item.priority`]="{ item }">
            <v-chip
              :color="priorityColors[item.ticket.priority]"
              variant="tonal"
              size="small"
              label
            >
              {{ priorityDisplayTexts[item.ticket.priority] }}
            </v-chip>
          </template>

          <template #[`item.user`]="{ item }">
            <template v-if="item.user">{{ item.user.name }}</template>
            <v-chip color="error" v-else> Kullanıcı Silinmiş </v-chip>
          </template>

          <template #[`item.creationDate`]="{ item }">
            {{ formatDateTime(item.ticket.creationDate) }}
          </template>

          <template #[`item.actions`]="{ item }">
            <v-icon-btn
              v-if="currentUser?.role === 'admin'"
              @click="
                selectedTicket = item.ticket.id;
                currentMode = ActionMode.Delete;
              "
              variant="text"
              color="error"
              icon="mdi-delete"
              aria-label="Destek talebini sil"
            />
            <v-btn
              rounded="lg"
              color="info"
              variant="text"
              class="text-none"
              append-icon="mdi-arrow-right"
              :to="`/support/tickets/${item.ticket.id}`"
            >
              Aç
            </v-btn>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>
  </v-container>

  <v-dialog max-width="450" v-model="showCrudDialog" persistent>
    <v-card rounded="lg">
      <v-card-title>
        <v-icon size="small" icon="mdi-plus" />
        Destek Talebi Oluştur
      </v-card-title>
      <v-form @submit.prevent="dialogSubmit">
        <v-card-text>
          <template v-if="currentMode === ActionMode.Create">
            <v-text-field
              variant="outlined"
              rounded="lg"
              label="Başlık"
              autocomplete="off"
              :rules="ticketForm.title.rules"
              v-model="ticketForm.title.value"
            />
            <v-textarea
              variant="outlined"
              rounded="lg"
              label="Açıklama"
              autocomplete="off"
              :rules="ticketForm.description.rules"
              v-model="ticketForm.description.value"
            />
            <v-select
              rounded="lg"
              v-model="ticketForm.priority.value"
              :items="[
                { value: 'low', title: 'Düşük' },
                { value: 'medium', title: 'Orta' },
                { value: 'high', title: 'Yüksek' },
                { value: 'urgent', title: 'Acil' },
              ]"
              label="Öncelik"
              variant="outlined"
              density="compact"
              hide-details
            />
          </template>
          <template v-else-if="currentMode === ActionMode.Delete">
            Silinen destek talepleri geri alınamaz, devam etmek istediğinize emin misiniz?
          </template>
          <template v-else> 🧑‍💻 </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn @click="currentMode = ActionMode.Idle" text="İptal" rounded="lg" />
          <v-btn
            type="submit"
            :loading="isSubmitting"
            :disabled="currentMode === ActionMode.Create && !formValid"
            :text="currentMode === ActionMode.Create ? 'Kaydet' : 'Evet'"
            :color="currentMode === ActionMode.Create ? 'primary' : 'error'"
            rounded="lg"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
