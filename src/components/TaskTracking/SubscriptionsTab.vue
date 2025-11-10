<script setup lang="ts">
import { watchDebounced } from '@vueuse/core';
import { format, formatISO, isValid, parseISO } from 'date-fns';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { reactive } from 'vue';
import { VDateInput, VIconBtn } from 'vuetify/labs/components';

import type { SubscriptionServerDataTableOptions } from '@/services/api/subscriptions';
import {
  createSubscription,
  deleteSubscription,
  patchSubscription,
} from '@/services/api/subscriptions';
import { cleanPayload } from '@/services/trpc';
import { useDisplayStore } from '@/stores/display';
import { useSnackbarStore } from '@/stores/snackbar';
import { useSubscriptionCustomersStore } from '@/stores/subscription-customers';
import { useSubscriptionsStore } from '@/stores/subscriptions';
import { ActionMode } from '@/types/action-mode';
import type { DataTableHeaders } from '@/types/data-table-headers';
import type { Subscription } from '@/types/subscription';
import { noEmptyRule } from '@/types/validations';
import { formatDateTime } from '@/utils/formatting';

import GixRefreshButton from '../GixRefreshButton.vue';
import GixTogglerMenu from '../GixTogglerMenu.vue';

const { mobile } = storeToRefs(useDisplayStore());

const subscriptionsStore = useSubscriptionsStore();
const { subscriptions, totalSubscriptionsCount } = storeToRefs(subscriptionsStore);

const subscriptionCustomersStore = useSubscriptionCustomersStore();
const { subscriptionCustomers } = storeToRefs(subscriptionCustomersStore);

onMounted(async () => {
  if (!subscriptionCustomers.value.length) {
    await subscriptionCustomersStore.loadSubscriptionCustomers();
  }
});

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loadSubscriptions = async (options?: SubscriptionServerDataTableOptions) => {
  try {
    await subscriptionsStore.loadSubscriptions(options);
  } catch (error) {
    console.error(error);
  } finally {
    subscriptionsLoaded.value = true;
  }
};

const selectedSubscription = ref<Subscription | null>(null);

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
  } else if (newValue === ActionMode.Create) {
    showCrudDialog.value = true;
  } else if (newValue === ActionMode.Edit && selectedSubscription.value) {
    showCrudDialog.value = true;

    subscriptionForm.startDate.value = selectedSubscription.value.startDate;
    subscriptionForm.endDate.value = selectedSubscription.value.endDate;
    subscriptionForm.subscriptionType.value = selectedSubscription.value.subscriptionType;
    subscriptionForm.userId.value = selectedSubscription.value.userId;
  } else {
    showCrudDialog.value = !!selectedSubscription.value;
  }
});

const subscriptionsLoaded = ref(false);

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'ID', key: 'id', sortable: false, toggled: true },
  { title: 'Tip', key: 'subscriptionType', sortable: true, toggled: true },
  { title: 'Başlangıç', key: 'startDate', sortable: true, toggled: true },
  { title: 'Bitiş', key: 'endDate', sortable: true, toggled: true },
  { title: 'Müşteri', key: 'userId', sortable: false, toggled: true },
  { title: 'İşlemler', key: 'actions', sortable: false, toggled: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

const subscriptionForm = reactive({
  startDate: { rules: [noEmptyRule], value: '' },
  endDate: { rules: [noEmptyRule], value: '' },
  subscriptionType: {
    rules: [noEmptyRule],
    value: 'domain' as 'domain' | 'ssl' | 'hosting' | 'mail',
  },
  userId: { rules: [noEmptyRule], value: null as number | null },
});

const isISODate = (dateOrString: string | Date) =>
  isValid(parseISO(typeof dateOrString === 'string' ? dateOrString : ''));

watchDebounced(
  [() => subscriptionForm.startDate.value, () => subscriptionForm.endDate.value],
  ([newStartDateValue, newEndDateValue]) => {
    if (newStartDateValue && !isISODate(newStartDateValue)) {
      subscriptionForm.startDate.value = formatISO(newStartDateValue).split('T')[0];
    }

    if (newEndDateValue && !isISODate(newEndDateValue)) {
      subscriptionForm.endDate.value = formatISO(newEndDateValue).split('T')[0];
    }
  },
  { debounce: 300 },
);

const resetForm = () => {
  Object.values(subscriptionForm).forEach((field) => {
    if (typeof field.value === 'string') field.value = '';
    if (typeof field.value === 'number') field.value = 0;
  });
  subscriptionForm.subscriptionType.value = 'domain';
};

const isSubmitting = ref(false);
const formActionModes = [ActionMode.Create, ActionMode.Edit];
const isForm = computed(() => formActionModes.includes(currentMode.value));

const cardIcon = computed(() => {
  switch (currentMode.value) {
    case ActionMode.Create:
      return 'mdi-plus';
    case ActionMode.Edit:
      return 'mdi-pencil';
    case ActionMode.Delete:
      return 'mdi-trash-can';
    default:
      return undefined;
  }
});
const cardTitle = computed(() => {
  switch (currentMode.value) {
    case ActionMode.Create:
      return 'Oluştur';
    case ActionMode.Edit:
      return 'Düzenle';
    case ActionMode.Delete:
      return 'Sil';
    case ActionMode.Idle:
      return '👋';
    default:
      return currentMode.value;
  }
});

const validateField = (field: (typeof subscriptionForm)[keyof typeof subscriptionForm]) =>
  field.rules.every((rule) => rule(field.value) === true);
const formValid = computed(() =>
  Object.values(subscriptionForm).every((field) => validateField(field)),
);
const editFormValid = computed(() =>
  Object.values(subscriptionForm).some((field) => validateField(field)),
);

const dialogSubmit = async () => {
  isSubmitting.value = true;

  const formSubscription = () => ({
    startDate: subscriptionForm.startDate.value,
    endDate: subscriptionForm.endDate.value,
    subscriptionType: subscriptionForm.subscriptionType.value,
    userId: subscriptionForm.userId.value!,
  });

  try {
    switch (currentMode.value) {
      case ActionMode.Create:
        const subscription = formSubscription();
        const createdSubscription = await createSubscription(subscription);

        const displaySubscription: Subscription = {
          ...subscription,
          id: createdSubscription.id,
          creationDate: createdSubscription.creationDate,
        };

        subscriptionsStore.addSubscriptionToList(displaySubscription, true);
        break;
      case ActionMode.Edit:
        if (!selectedSubscription.value?.id) return;

        const editedSubscription = formSubscription();

        const editResponse = await patchSubscription(
          selectedSubscription.value.id,
          editedSubscription,
        );

        const displayEditedSubscription: Omit<Subscription, 'id'> = {
          ...selectedSubscription.value,
          ...cleanPayload(editedSubscription, true),
          updatedOn: editResponse.updatedOn,
        };

        subscriptionsStore.updateSubscriptionById(
          selectedSubscription.value.id,
          displayEditedSubscription,
        );
        break;
      case ActionMode.Delete:
        if (!selectedSubscription.value?.id) return;

        await deleteSubscription(selectedSubscription.value.id);

        subscriptionsStore.removeSubscriptionsById([selectedSubscription.value.id]);
        break;
      case ActionMode.Idle:
        throw new Error('Not implemented yet: ActionMode.Idle case');
      default:
        break;
    }
  } catch (error) {
    console.error(error);
    snackbarError.value = true;
    snackbarText.value = 'Beklenmeyen bir hata ile karşılaşıldı.';
    snackbar.value = true;
  } finally {
    isSubmitting.value = false;
    currentMode.value = ActionMode.Idle;
  }
};
</script>

<template>
  <v-data-table-server
    :items="subscriptions"
    :items-length="totalSubscriptionsCount"
    @update:options="loadSubscriptions"
    :headers="includedDataTableHeaders"
    class="rounded-lg elevation-0 border"
    fixed-header
    hover
    :mobile="mobile.value"
    loading-text="Abonelikler yükleniyor..."
    no-data-text="Abonelikler bulunamadı."
    items-per-page-text="Sayfa başı abonelikler"
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          Abonelikler
        </v-toolbar-title>

        <GixTogglerMenu
          menu-activator-btn-text="Kolonlar"
          menu-activator-btn-class="rounded-lg border me-3"
          menu-activator-btn-icon="mdi-filter-variant"
          v-model:toggle-items="dataTableHeaders"
        />
        <v-btn
          rounded="lg"
          @click="currentMode = ActionMode.Create"
          class="me-3"
          border
          prepend-icon="mdi-plus"
        >
          Ekle
        </v-btn>

        <GixRefreshButton class="me-5" :refresh-fn="() => loadSubscriptions()" />
      </v-toolbar>
    </template>

    <template #[`item.startDate`]="{ item }">
      {{ formatDateTime(item.startDate, 'dd.MM.yyyy') }}
    </template>
    <template #[`item.endDate`]="{ item }">
      {{ formatDateTime(item.endDate, 'dd.MM.yyyy') }}
    </template>
    <template #[`item.userId`]="{ item }">
      <v-chip>{{ subscriptionCustomers.find((sc) => sc.id === item.userId)?.title }}</v-chip>
    </template>
    <template #[`item.actions`]="{ item }">
      <v-icon-btn
        icon="mdi-pencil"
        color="secondary"
        variant="text"
        @click.stop="
          selectedSubscription = item;
          currentMode = ActionMode.Edit;
        "
      />
      <v-icon-btn
        icon="mdi-trash-can"
        color="error"
        variant="text"
        @click.stop="
          selectedSubscription = item;
          currentMode = ActionMode.Delete;
        "
      />
    </template>
  </v-data-table-server>

  <v-dialog max-width="450" v-model="showCrudDialog">
    <v-card rounded="lg">
      <v-card-title>
        <v-icon size="small" :icon="cardIcon" />
        {{ cardTitle }}
      </v-card-title>
      <v-form @submit.prevent="dialogSubmit">
        <v-card-text>
          <template v-if="isForm">
            <v-date-input
              class="mb-2"
              variant="outlined"
              rounded="lg"
              placeholder="gg.aa.yyyy"
              label="Başlangıç Tarihi"
              :rules="subscriptionForm.startDate.rules"
              v-model="subscriptionForm.startDate.value"
              :display-format="(date: Date) => format(date, 'dd.MM.yyyy')"
            />
            <v-date-input
              class="mb-2"
              variant="outlined"
              rounded="lg"
              placeholder="gg.aa.yyyy"
              label="Bitiş Tarihi"
              :rules="subscriptionForm.endDate.rules"
              v-model="subscriptionForm.endDate.value"
              :display-format="(date: Date) => format(date, 'dd.MM.yyyy')"
            />
            <v-select
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="Abonelik Tipi"
              :items="['domain', 'ssl', 'hosting', 'mail']"
              :rules="subscriptionForm.subscriptionType.rules"
              v-model="subscriptionForm.subscriptionType.value"
            />
            <v-autocomplete
              :items="subscriptionCustomers"
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="Müşteri"
              :rules="subscriptionForm.userId.rules"
              placeholder="Seçiniz"
              v-model.number="subscriptionForm.userId.value"
              item-value="id"
              item-title="title"
            />
          </template>
          <template v-else-if="currentMode === ActionMode.Delete">
            Silinen abonelikler geri alınamaz, devam etmek istediğinize emin misiniz?
          </template>
          <template v-else> 🧑‍💻 </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="currentMode = ActionMode.Idle" text="İptal" rounded="lg" />
          <v-btn
            type="submit"
            :loading="isSubmitting"
            :disabled="
              isSubmitting ||
              (currentMode === ActionMode.Create && !formValid) ||
              (currentMode === ActionMode.Edit && !editFormValid)
            "
            :text="isForm ? 'Kaydet' : 'Evet'"
            :color="isForm ? 'primary' : 'error'"
            rounded="lg"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
