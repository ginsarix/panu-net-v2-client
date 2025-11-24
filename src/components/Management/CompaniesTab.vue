<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { format } from 'date-fns';
import { storeToRefs } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import { VDateInput, VIconBtn, VMaskInput } from 'vuetify/labs/components';

import GixSelectionInfoBar from '@/components/GixSelectionInfoBar.vue';
import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import {
  type CompanyServerDataTableOptions,
  createCompany,
  deleteCompanies,
  deleteCompany,
  patchCompany,
} from '@/services/api/companies.ts';
import { cleanPayload } from '@/services/trpc';
import { useCompaniesStore } from '@/stores/companies.ts';
import { useDisplayStore } from '@/stores/display.ts';
import { useSnackbarStore } from '@/stores/snackbar';
import { ActionMode } from '@/types/action-mode.ts';
import type { Company } from '@/types/company.ts';
import type { DataTableHeaders } from '@/types/data-table-headers.ts';
// stepper properties inlined in template
import { noEmptyRule, phoneRules } from '@/types/validations.ts';
import { formatDateTime } from '@/utils/formatting.ts';

import GixRefreshButton from '../GixRefreshButton.vue';
import CompanyCloner from './CompanyCloner.vue';

const { mobile } = storeToRefs(useDisplayStore());

const companiesStore = useCompaniesStore();
const { companies, totalCompaniesCount } = storeToRefs(companiesStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const selectedCompany = ref<Company | null>(null);
const selectedCompanyIds = ref<number[]>([]);

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
  } else if (newValue === ActionMode.Create) {
    showCrudDialog.value = true;
  } else {
    showCrudDialog.value = !!(selectedCompany.value || selectedCompanyIds.value.length);
  }
});

// form state handled like UsersTab.vue
const companyForm = reactive({
  code: { rules: [noEmptyRule], value: '' as number | string },
  name: { rules: [noEmptyRule], value: '' },
  manager: { rules: [noEmptyRule], value: '' },
  phone: { rules: phoneRules, value: '' },
  licenseDate: { rules: [noEmptyRule], value: null as Date | null },
  webServiceSource: { rules: [noEmptyRule], value: '' },
  webServiceUsername: { rules: [noEmptyRule], value: '' },
  apiKey: { rules: [], value: '' },
  apiSecret: { rules: [noEmptyRule], value: '' },
  status: { rules: [], value: true },
});

// steps are inlined directly in the template below

const dialogErrorMessage = ref('');

// local dialog state/helpers (like UsersTab)
const isSubmitting = ref(false);
const formSubmitted = ref(false);

const resetForm = () => {
  Object.values(companyForm).forEach((field) => {
    if (typeof field.value === 'string') field.value = '';
    else if (typeof field.value === 'boolean') field.value = true;
    else field.value = null;
  });
};

const validateField = (field: (typeof companyForm)[keyof typeof companyForm]) =>
  field.rules.every((rule) => rule(field.value as never) === true);

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

const formValid = computed(() => Object.values(companyForm).every((field) => validateField(field)));
const editFormValid = computed(() =>
  Object.values(companyForm).some((field) => validateField(field)),
);

// ensure form resets when mode becomes idle
watch(currentMode, (val) => {
  if (val === ActionMode.Idle) resetForm();
  if (val === ActionMode.Edit && selectedCompany.value) {
    // prefill form from selectedCompany
    const s = selectedCompany.value;
    companyForm.code.value = s?.code ?? '';
    companyForm.name.value = s?.name ?? '';
    companyForm.manager.value = s?.manager ?? '';
    companyForm.phone.value = s?.phone ?? '';
    companyForm.licenseDate.value = s?.licenseDate ? new Date(s.licenseDate) : null;
    companyForm.webServiceSource.value = s?.webServiceSource ?? '';
    companyForm.webServiceUsername.value = s?.webServiceUsername ?? '';
    companyForm.apiKey.value = s?.apiKey ?? '';
    companyForm.apiSecret.value = s?.apiSecret ?? '';
    companyForm.status.value = !!s?.status;
  }
  if (val === ActionMode.Create) resetForm();
});

const companiesLoaded = ref(false);

const loadCompanies = async (options?: CompanyServerDataTableOptions) => {
  try {
    await companiesStore.loadCompanies(options);
  } catch (error) {
    console.error(error);
  } finally {
    companiesLoaded.value = true;
  }
};

const dialogSubmit = async () => {
  if (selectedCompanyIds.value.length && currentMode.value === ActionMode.Delete) {
    await batchDelete();
    return;
  }

  const formCompany = (): Partial<Company> => {
    return {
      code: Number(companyForm.code.value),
      name: companyForm.name.value,
      manager: companyForm.manager.value,
      phone: companyForm.phone.value,
      licenseDate: companyForm.licenseDate.value
        ? new Date(companyForm.licenseDate.value)
        : new Date(),
      webServiceSource: companyForm.webServiceSource.value,
      webServiceUsername: companyForm.webServiceUsername.value,
      apiKey: companyForm.apiKey.value,
      apiSecret: companyForm.apiSecret.value,
      status: !!companyForm.status.value,
    };
  };

  try {
    switch (currentMode.value) {
      case ActionMode.Create:
        const company = formCompany();
        const createdCompany = await createCompany(company as Company);

        const displayCompany = {
          ...(company as Company),
          id: createdCompany.id,
          creationDate: createdCompany.creationDate,
        };
        companiesStore.addCompanyToList(displayCompany, true);
        break;
      case ActionMode.Edit:
        const editCompany = formCompany();

        if (!selectedCompany.value?.id) return;

        const editedCompany = await patchCompany(selectedCompany.value.id, editCompany);

        const displayedEditedCompany = {
          ...selectedCompany.value,
          ...cleanPayload(editCompany),
          updatedOn: editedCompany.updatedOn,
        };
        companiesStore.updateCompanyById(selectedCompany.value.id, displayedEditedCompany);
        break;
      case ActionMode.Delete:
        if (!selectedCompany.value?.id) return;

        await deleteCompany(selectedCompany.value.id);
        companiesStore.removeCompaniesById([selectedCompany.value.id]);
        break;
      case ActionMode.Idle: {
        throw new Error('Not implemented yet: ActionMode.Idle case');
      }
      default:
        break;
    }
  } catch (error) {
    console.error(error);

    snackbarError.value = true;
    snackbarText.value =
      error instanceof TRPCClientError ? error.message : 'Beklenmeyen bir hata ile karşılaşıldı.';
    snackbar.value = true;
  }
};

const batchDelete = async () => {
  if (!selectedCompanyIds.value.length) return;

  try {
    await deleteCompanies(selectedCompanyIds.value);
    companiesStore.removeCompaniesById(selectedCompanyIds.value);
  } catch (error) {
    console.error(error);
  }
};

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'ID', key: 'id', toggled: false, sortable: true },
  { title: 'Kod', key: 'code', toggled: true, sortable: true },
  { title: 'Ad', key: 'name', toggled: true, sortable: true },
  { title: 'Yönetici', key: 'manager', toggled: true, sortable: true },
  { title: 'Telefon', key: 'phone', toggled: true, sortable: false },
  { title: 'Lisans Tarihi', key: 'licenseDate', toggled: true, sortable: true },
  { title: 'Durum', key: 'status', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: 'creationDate', toggled: true, sortable: true },
  { title: 'Güncellenme Tarihi', key: 'updatedOn', toggled: true, sortable: true },
  { title: 'İşlemler', key: 'actions', sortable: false, toggled: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

const infoDialog = ref(false);

const showApiPassword = ref(false);
const handleSubmit = async () => {
  formSubmitted.value = true;

  if (currentMode.value === ActionMode.Create && !formValid.value) return;

  isSubmitting.value = true;
  await dialogSubmit();

  // close dialog and reset mode
  currentMode.value = ActionMode.Idle;
  isSubmitting.value = false;
};
</script>

<template>
  <v-data-table-server
    v-model="selectedCompanyIds"
    @update:options="loadCompanies"
    :headers="includedDataTableHeaders"
    :items-length="totalCompaniesCount"
    :items="companies"
    :loading="!companiesLoaded"
    class="rounded-lg elevation-0 border"
    fixed-header
    :mobile="mobile.value"
    hover
    loading-text="Firmalar yükleniyor..."
    no-data-text="Firmalar bulunamadı."
    items-per-page-text="Sayfa başı firmalar"
    show-select
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          Firmalar
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
          prepend-icon="mdi-domain-plus"
        >
          Ekle
        </v-btn>

        <CompanyCloner :companies class="me-3" />

        <GixRefreshButton class="me-5" :refresh-fn="() => loadCompanies()" />
      </v-toolbar>
    </template>
    <template #[`item.status`]="{ item }">
      {{ item.status ? 'Aktif' : 'Pasif' }}
    </template>
    <template #[`item.licenseDate`]="{ item }">
      {{ formatDateTime(item.licenseDate, 'dd.MM.yyyy') }}
    </template>
    <template #[`item.creationDate`]="{ item }">
      {{ item.creationDate ? formatDateTime(item.creationDate) : '' }}
    </template>
    <template #[`item.updatedOn`]="{ item }">
      {{ item.updatedOn ? formatDateTime(item.updatedOn) : 'Düzenlenmedi' }}
    </template>
    <template #[`item.actions`]="{ item }">
      <div class="d-flex justify-center">
        <v-icon-btn
          icon="mdi-pencil"
          color="secondary"
          variant="text"
          @click.stop="
            selectedCompany = item;
            currentMode = ActionMode.Edit;
          "
        />
        <v-icon-btn
          icon="mdi-trash-can"
          color="error"
          variant="text"
          @click.stop="
            selectedCompany = item;
            currentMode = ActionMode.Delete;
          "
        />

        <v-icon-btn
          icon="mdi-eye"
          variant="text"
          color="success"
          @click.stop="
            selectedCompany = item;
            infoDialog = true;
          "
        />
      </div>
    </template>
  </v-data-table-server>

  <v-dialog v-model="infoDialog" max-width="500">
    <v-card rounded="lg">
      <v-card-title class="text-h6 text-center">
        {{ selectedCompany?.name }}
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-list density="compact">
          <v-list-item>
            <v-row>
              <v-col cols="6" class="text-body-2 font-weight-medium">Kod:</v-col>
              <v-col cols="6" class="text-body-2 text-right">{{ selectedCompany?.code }}</v-col>
            </v-row>

            <v-row>
              <v-col cols="6" class="text-body-2 font-weight-medium">Yönetici:</v-col>
              <v-col cols="6" class="text-body-2 text-right">{{ selectedCompany?.manager }}</v-col>
            </v-row>

            <v-row>
              <v-col cols="6" class="text-body-2 font-weight-medium">Telefon:</v-col>
              <v-col cols="6" class="text-body-2 text-right">{{ selectedCompany?.phone }}</v-col>
            </v-row>

            <v-row>
              <v-col cols="6" class="text-body-2 font-weight-medium">Oluşturulma:</v-col>
              <v-col cols="6" class="text-body-2 text-right">
                {{
                  selectedCompany?.creationDate ? formatDateTime(selectedCompany.creationDate) : ''
                }}
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6" class="text-body-2 font-weight-medium">Güncellenme:</v-col>
              <v-col cols="6" class="text-body-2 text-right">
                {{ selectedCompany?.updatedOn ? formatDateTime(selectedCompany.updatedOn) : '' }}
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <v-row>
              <v-col cols="6" class="text-body-2 font-weight-medium">Durum:</v-col>
              <v-col cols="6" class="text-body-2 text-right">
                {{ selectedCompany?.status ? '✅' : '❌' }}
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6" class="text-body-2 font-weight-medium">Lisans Tarihi:</v-col>
              <v-col cols="6" class="text-body-2 text-right">
                {{
                  selectedCompany?.licenseDate
                    ? formatDateTime(selectedCompany.licenseDate, 'dd.MM.yyyy')
                    : ''
                }}
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <v-row>
              <v-col cols="12" class="text-body-2 font-weight-medium text-center">
                {{ selectedCompany?.webServiceSource }}
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6" class="text-body-2 font-weight-medium">Kullanıcı Adı:</v-col>
              <v-col cols="6" class="text-body-2 text-right">
                {{ selectedCompany?.webServiceUsername }}
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6" class="text-body-2 font-weight-medium">API Key:</v-col>
              <v-col cols="6" class="text-body-2 text-right">
                {{ selectedCompany?.apiKey }}
              </v-col>
            </v-row>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn @click="infoDialog = false" color="primary" variant="text">Tamam</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showCrudDialog" persistent max-width="600">
    <v-card rounded="lg">
      <v-card-title>
        <v-icon size="small" :icon="cardIcon" />
        {{ cardTitle }}
      </v-card-title>

      <v-form class="pa-2" @submit.prevent="handleSubmit">
        <v-card-text>
          <v-alert v-if="dialogErrorMessage" type="error" class="mb-4" closable>
            {{ dialogErrorMessage }}
          </v-alert>

          <template v-if="isForm">
            <v-stepper
              editable
              :items="['Şirket Bilgileri', 'Lisans & Durum', 'Entegrasyon', 'API Erişimi']"
              :hide-actions="false"
              rounded="lg"
              prev-text="Önceki"
              next-text="Sonraki"
            >
              <!-- Step 1: Şirket Bilgileri -->
              <template #[`item.1`]>
                <v-text-field
                  label="Firma Kodu"
                  variant="outlined"
                  rounded="lg"
                  :rules="companyForm.code.rules"
                  v-model="companyForm.code.value"
                />

                <v-text-field
                  label="Firma İsimi"
                  variant="outlined"
                  rounded="lg"
                  :rules="companyForm.name.rules"
                  v-model="companyForm.name.value"
                />

                <v-text-field
                  label="Yönetici Adı Soyadı"
                  variant="outlined"
                  rounded="lg"
                  :rules="companyForm.manager.rules"
                  v-model="companyForm.manager.value"
                />

                <v-mask-input
                  mask="phone"
                  label="Cep Telefonu"
                  :placeholder="'(###) ### - ####'"
                  variant="outlined"
                  rounded="lg"
                  :rules="companyForm.phone.rules"
                  v-model="companyForm.phone.value"
                />
              </template>

              <!-- Step 2: Lisans & Durum -->
              <template #[`item.2`]>
                <v-date-input
                  :display-format="(date: Date) => format(date, 'dd.MM.yyyy')"
                  label="Lisans tarihi"
                  placeholder="gg.aa.yyyy"
                  variant="outlined"
                  rounded="lg"
                  :rules="companyForm.licenseDate.rules"
                  v-model="companyForm.licenseDate.value"
                />

                <v-checkbox label="Durum" v-model="companyForm.status.value" />
              </template>

              <!-- Step 3: Entegrasyon -->
              <template #[`item.3`]>
                <v-text-field
                  label="Web Service Kaynak"
                  variant="outlined"
                  rounded="lg"
                  :rules="companyForm.webServiceSource.rules"
                  v-model="companyForm.webServiceSource.value"
                />

                <v-text-field
                  label="Web Service Kullanıcı Adı"
                  variant="outlined"
                  rounded="lg"
                  :rules="companyForm.webServiceUsername.rules"
                  v-model="companyForm.webServiceUsername.value"
                />
              </template>

              <!-- Step 4: API Erişimi -->
              <template #[`item.4`]>
                <v-text-field
                  label="API Key"
                  variant="outlined"
                  rounded="lg"
                  v-model="companyForm.apiKey.value"
                />

                <v-text-field
                  :type="showApiPassword ? 'text' : 'password'"
                  label="API Şifresi"
                  variant="outlined"
                  rounded="lg"
                  :append-inner-icon="showApiPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showApiPassword = !showApiPassword"
                  :rules="companyForm.apiSecret.rules"
                  v-model="companyForm.apiSecret.value"
                />
              </template>
            </v-stepper>
          </template>

          <div v-else-if="currentMode === ActionMode.Delete">
            <span> Silinen firmalar geri alınamaz, devam etmek istediğinize emin misiniz? </span>
          </div>
          <div v-else>🧑‍💻</div>
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

  <GixSelectionInfoBar
    @submit="currentMode = ActionMode.Delete"
    v-model:selected-ids="selectedCompanyIds"
    :objects="companies"
    submit-btn-icon="mdi-trash-can"
  />
</template>
