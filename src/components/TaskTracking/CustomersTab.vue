<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import { VIconBtn, VMaskInput } from 'vuetify/labs/components';

import type { SubscriptionCustomerServerDataTableOptions } from '@/services/api/subscription-customers';
import { createSubscriptionCustomer } from '@/services/api/subscription-customers';
import { useDisplayStore } from '@/stores/display';
import { useSnackbarStore } from '@/stores/snackbar';
import { useSubscriptionCustomersStore } from '@/stores/subscription-customers';
import { ActionMode } from '@/types/action-mode';
import type { DataTableHeaders } from '@/types/data-table-headers';
import type { SubscriptionCustomer } from '@/types/subscription-customer';
import { emailRules, noEmptyRule, phoneRules } from '@/types/validations';

import GixRefreshButton from '../GixRefreshButton.vue';
import GixTogglerMenu from '../GixTogglerMenu.vue';

const { mobile } = storeToRefs(useDisplayStore());

const subscriptionCustomersStore = useSubscriptionCustomersStore();
const { subscriptionCustomers } = storeToRefs(subscriptionCustomersStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loadCustomers = async (options?: SubscriptionCustomerServerDataTableOptions) => {
  try {
    await subscriptionCustomersStore.loadSubscriptionCustomers(options);
  } catch (error) {
    console.error(error);
  } finally {
    customersLoaded.value = true;
  }
};

const selectedCustomer = ref<SubscriptionCustomer | null>(null);
const selectedCustomerIds = ref<number[]>([]);

const currentMode = ref(ActionMode.Idle);
const showCrudDialog = computed(() => {
  if (currentMode.value === ActionMode.Idle) return false;
  if (currentMode.value === ActionMode.Create) return true;
  return !!(selectedCustomer.value || selectedCustomerIds.value.length);
});

watch(currentMode, (newValue) => {
  if (newValue === ActionMode.Idle) resetForm();
});

const customersLoaded = ref(false);

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'ID', key: 'id', sortable: false, toggled: true },
  { title: 'Kod', key: 'customerCode', sortable: true, toggled: true },
  { title: 'Başlık', key: 'title', sortable: true, toggled: true },
  { title: 'Telefon', key: 'phone', sortable: true, toggled: true },
  { title: 'E-posta', key: 'email', sortable: true, toggled: true },
  { title: 'Adres', key: 'address', sortable: false, toggled: true },
  { title: 'Durum', key: 'status', sortable: true, toggled: true },
  { title: 'Yönetici', key: 'manager', sortable: true, toggled: true },
  { title: 'İşlemler', key: 'actions', sortable: false, toggled: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

const customerForm = reactive({
  customerCode: { rules: [noEmptyRule], value: 0 },
  title: { rules: [noEmptyRule], value: '' },
  phone: { rules: phoneRules, value: '' },
  email: { rules: emailRules, value: '' },
  address: { rules: [], value: '' },
  status: { rules: [], value: true },
  manager: { rules: [], value: '' },
});

const resetForm = () => {
  Object.values(customerForm).forEach((field) => {
    if (typeof field.value === 'string') field.value = '';
    if (typeof field.value === 'number') field.value = 0;
    if (typeof field.value === 'boolean') field.value = true;
  });
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

const validateField = (field: (typeof customerForm)[keyof typeof customerForm]) =>
  field.rules.every((rule) =>
    typeof field.value === 'string' || typeof field.value === 'number'
      ? rule(String(field.value)) === true
      : true,
  );
const formValid = computed(() =>
  Object.values(customerForm).every((field) => validateField(field)),
);
const editFormValid = computed(() =>
  Object.values(customerForm).some((field) => validateField(field)),
);

const dialogSubmit = async () => {
  isSubmitting.value = true;

  if (selectedCustomerIds.value.length && currentMode.value === ActionMode.Delete) {
    subscriptionCustomersStore.removeSubscriptionCustomersById(selectedCustomerIds.value);
    await loadCustomers();
    isSubmitting.value = false;
    currentMode.value = ActionMode.Idle;
    return;
  }

  const formCustomer = () => ({
    customerCode: customerForm.customerCode.value,
    title: customerForm.title.value,
    phone: customerForm.phone.value,
    email: customerForm.email.value,
    address: customerForm.address.value,
    status: customerForm.status.value,
    manager: customerForm.manager.value,
  });

  try {
    switch (currentMode.value) {
      case ActionMode.Create:
        const customer = formCustomer();

        const response = await createSubscriptionCustomer(customer);

        const displaySubscriptionCustomer = {
          ...customer,
          id: response.id,
          creationDate: response.creationDate,
        };

        subscriptionCustomersStore.addSubscriptionCustomerToList(displaySubscriptionCustomer, true);
        break;
      case ActionMode.Edit:
        if (!selectedCustomer.value?.id) return;
        subscriptionCustomersStore.updateSubscriptionCustomerById(
          selectedCustomer.value.id,
          formCustomer(),
        );
        break;
      case ActionMode.Delete:
        if (!selectedCustomer.value?.id) return;
        subscriptionCustomersStore.removeSubscriptionCustomersById([selectedCustomer.value.id]);
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
    :items="subscriptionCustomers"
    :items-length="subscriptionCustomers.length"
    @update:options="loadCustomers"
    :headers="includedDataTableHeaders"
    class="rounded-lg elevation-0 border"
    fixed-header
    hover
    :mobile="mobile.value"
    loading-text="Müşteriler yükleniyor..."
    no-data-text="Müşteri bulunamadı."
    items-per-page-text="Sayfa başı müşteri"
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-account" size="x-small" start />
          Müşteriler
        </v-toolbar-title>

        <GixTogglerMenu
          menu-activator-btn-text="Filtrele"
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

        <GixRefreshButton class="me-5" :refresh-fn="() => loadCustomers()" />
      </v-toolbar>
    </template>
    <template #[`item.status`]="{ item }">
      {{ item.status ? 'Aktif' : 'Pasif' }}
    </template>
    <template #[`item.actions`]="{ item }">
      <div class="d-flex justify-end">
        <v-icon-btn
          icon="mdi-pencil"
          color="secondary"
          variant="text"
          @click.stop="
            selectedCustomer = item;
            currentMode = ActionMode.Edit;
          "
        />
        <v-icon-btn
          icon="mdi-trash-can"
          color="error"
          variant="text"
          @click.stop="
            selectedCustomer = item;
            currentMode = ActionMode.Delete;
          "
        />
      </div>
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
            <v-text-field
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="Kod"
              v-model.number="customerForm.customerCode.value"
              :rules="customerForm.customerCode.rules"
              type="number"
            />
            <v-text-field
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="Başlık"
              :rules="customerForm.title.rules"
              v-model="customerForm.title.value"
            />
            <v-mask-input
              class="mb-3"
              variant="outlined"
              placeholder="(###) ### - ####"
              append-inner-icon="mdi-phone"
              mask="phone"
              rounded="lg"
              label="Telefon"
              :rules="customerForm.phone.rules"
              v-model="customerForm.phone.value"
            />
            <v-text-field
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="E-posta"
              type="email"
              append-inner-icon="mdi-email"
              :rules="customerForm.email.rules"
              v-model="customerForm.email.value"
            />
            <v-text-field
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="Adres"
              v-model="customerForm.address.value"
            />
            <v-switch
              class="mb-2"
              label="Durum"
              v-model="customerForm.status.value"
              color="primary"
              :true-value="true"
              :false-value="false"
            />
            <v-text-field
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="Yönetici"
              v-model="customerForm.manager.value"
            />
          </template>
          <template v-else-if="currentMode === ActionMode.Delete">
            Silinen müşteriler geri alınamaz, devam etmek istediğinize emin misiniz?
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
