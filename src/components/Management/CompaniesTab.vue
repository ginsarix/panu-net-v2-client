<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { computed, ref } from 'vue';
import { VIconBtn } from 'vuetify/labs/components';

import GixCrudDialog from '@/components/GixCrudDialog.vue';
import GixSelectionInfoBar from '@/components/GixSelectionInfoBar.vue';
import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import {
  type CompanyServerDataTableOptions,
  createCompany,
  deleteCompanies,
  deleteCompany,
  patchCompany,
} from '@/services/api/companies.ts';
import { useCompaniesStore } from '@/stores/companies.ts';
import { useDisplayStore } from '@/stores/display.ts';
import { useAppOptionsStore } from '@/stores/options.ts';
import { useSnackbarStore } from '@/stores/snackbar';
import { ActionMode } from '@/types/action-mode.ts';
import type { Company } from '@/types/company.ts';
import type { DataTableHeaders } from '@/types/data-table-headers.ts';
import type { InputProperties } from '@/types/input-properties.ts';
import type { StepperProperties } from '@/types/stepper-properties.ts';
import { noEmptyRule } from '@/types/validations.ts';
import { formatDateTime } from '@/utils/formatting.ts';

import DataTableInfo from '../DataTableInfo.vue';
import GixRefreshButton from '../GixRefreshButton.vue';

const appOptionsStore = useAppOptionsStore();
const { appOptions } = storeToRefs(appOptionsStore);

const { mobile } = storeToRefs(useDisplayStore());

const companiesStore = useCompaniesStore();
const { companies, totalCompaniesCount } = storeToRefs(companiesStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const selectedCompany = ref<Company | null>(null);
const selectedCompanyIds = ref<number[]>([]);

const currentMode = ref(ActionMode.Idle);
const showCrudDialog = computed(() => {
  if (currentMode.value === ActionMode.Idle) return false;

  if (currentMode.value === ActionMode.Create) return true;

  return !!(selectedCompany.value || selectedCompanyIds.value.length > 0);
});

const companyInputPropertiesIds = {
  code: uuidv4(),
  name: uuidv4(),
  managerName: uuidv4(),
  phone: uuidv4(),
  licenseDate: uuidv4(),
  wsSource: uuidv4(),
  wsUsername: uuidv4(),
  serverName: uuidv4(),
  period: uuidv4(),
  apiKey: uuidv4(),
  apiSecret: uuidv4(),
  status: uuidv4(),
};

const companyInputProperties = ref<InputProperties[]>([
  {
    id: companyInputPropertiesIds.code,
    label: 'Kod',
    type: 'text',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.name,
    label: 'İsim',
    type: 'text',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.managerName,
    label: 'Yönetici Adı',
    type: 'text',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.phone,
    label: 'Telefon',
    type: 'tel',
    value: '',
  },
  {
    id: companyInputPropertiesIds.licenseDate,
    label: 'Lisans tarihi',
    type: 'date',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.wsSource,
    label: 'Web Service Kaynak',
    type: 'url',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.wsUsername,
    label: 'Web Service Kullanıcı Adı',
    type: 'text',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.serverName,
    label: 'Sunucu Adı',
    type: 'text',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.period,
    label: 'Dönem',
    type: 'number',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.apiKey,
    label: 'API Key',
    type: 'text',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.apiSecret,
    label: 'API Şifresi',
    type: 'password',
    showPassword: false,
    icon: 'mdi-lock',
    validationRules: [noEmptyRule],
    value: '',
  },
  {
    id: companyInputPropertiesIds.status,
    label: 'Durum',
    type: 'checkbox',
    value: 'true',
    neverResetValue: true,
  },
]);

const companyInputSteppers: StepperProperties[] = [
  {
    step: 1,
    title: 'Şirket Bilgileri',
    inputIds: [
      companyInputPropertiesIds.code,
      companyInputPropertiesIds.name,
      companyInputPropertiesIds.managerName,
      companyInputPropertiesIds.phone,
    ],
  },
  {
    step: 2,
    title: 'Lisans & Durum',
    inputIds: [companyInputPropertiesIds.licenseDate, companyInputPropertiesIds.status],
  },
  {
    step: 3,
    title: 'Entegrasyon',
    inputIds: [
      companyInputPropertiesIds.wsSource,
      companyInputPropertiesIds.wsUsername,
      companyInputPropertiesIds.serverName,
      companyInputPropertiesIds.period,
    ],
  },
  {
    step: 4,
    title: 'API Erişimi',
    inputIds: [companyInputPropertiesIds.apiKey, companyInputPropertiesIds.apiSecret],
  },
];

const dialogErrorMessage = ref('');

const companiesLoaded = ref(false);

const loadCompanies = async (options?: CompanyServerDataTableOptions, giveCacheFeedback = true) => {
  const cacheFeedbackPreference = appOptions.value.giveCacheFeedback;
  appOptions.value.giveCacheFeedback = giveCacheFeedback;
  try {
    await companiesStore.loadCompanies(options);
  } catch (error) {
    console.error(error);
  } finally {
    companiesLoaded.value = true;

    appOptions.value.giveCacheFeedback = cacheFeedbackPreference;
  }
};

const dialogSubmit = async (inputProperties: InputProperties[]) => {
  if (selectedCompanyIds.value.length > 0 && currentMode.value === ActionMode.Delete) {
    await batchDelete();
    return;
  }

  const formCompany = (): Partial<Company> => {
    const periodVal = parseInt(inputProperties[8].value, 10);

    return {
      code: inputProperties[0].value,
      name: inputProperties[1].value,
      manager: inputProperties[2].value,
      phone: inputProperties[3].value,
      licenseDate: inputProperties[4].value,
      webServiceSource: inputProperties[5].value,
      webServiceUsername: inputProperties[6].value,
      serverName: inputProperties[7].value,
      period: isNaN(periodVal) ? undefined : periodVal,
      apiKey: inputProperties[9].value,
      apiSecret: inputProperties[10].value,
      status: inputProperties[11].value.toLowerCase() === 'true',
    };
  };

  const willUpdateNextRefreshText = 'Sonraki güncellemede yenilenecektir';

  try {
    switch (currentMode.value) {
      case ActionMode.Create:
        const company = formCompany();

        const isValidCompany = Object.keys(company)
          .filter((key) => !['id', 'phone'].includes(key))
          .every((key) => Boolean(company[key as keyof Company]));

        if (isValidCompany) {
          await createCompany(company as Company);

          const latestCompanyId = companies.value[0].id;

          const displayCompany = {
            ...(company as Company),
            id: latestCompanyId ? latestCompanyId + 1 : latestCompanyId,
            creationDate: willUpdateNextRefreshText,
          };
          companiesStore.addCompanyToList(displayCompany, true);
        }
        break;
      case ActionMode.Edit:
        const editedCompany = formCompany();

        if (!selectedCompany.value?.id) return;

        await patchCompany(selectedCompany.value.id, editedCompany);

        const displayedEditedCompany = {
          ...selectedCompany.value,
          ...Object.fromEntries(Object.entries(editedCompany).filter(([, v]) => v !== '')),
          updatedOn: willUpdateNextRefreshText,
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
  if (selectedCompanyIds.value.length === 0) return;

  try {
    await deleteCompanies(selectedCompanyIds.value);
    companiesStore.removeCompaniesById(selectedCompanyIds.value);
  } catch (error) {
    console.error(error);
  }
};

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'ID', key: 'id', toggled: true, sortable: true },
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
</script>

<template>
  <v-data-table-server
    v-model="selectedCompanyIds"
    @update:options="(options) => loadCompanies(options, false)"
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
          prepend-icon="mdi-domain-plus"
        >
          Ekle
        </v-btn>

        <GixRefreshButton :refresh-fn="() => loadCompanies()" />
        <DataTableInfo class="me-5" />
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
      <div class="d-flex justify-end">
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
      </div>
    </template>
  </v-data-table-server>

  <GixCrudDialog
    v-model:show-dialog="showCrudDialog"
    v-model:current-mode="currentMode"
    delete-text="Silinen firmalar geri alınamaz, devam etmek istediğinize emin misiniz?"
    v-model:inputs-properties="companyInputProperties"
    :stepper-properties="companyInputSteppers"
    @submit="dialogSubmit"
    :error-message="dialogErrorMessage"
    max-dialog-width="600"
  />

  <GixSelectionInfoBar
    @submit="currentMode = ActionMode.Delete"
    v-model:selected-ids="selectedCompanyIds"
    :objects="companies"
    submit-btn-icon="mdi-trash-can"
  />
</template>
