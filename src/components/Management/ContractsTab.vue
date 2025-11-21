<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import axios from 'axios';
import { storeToRefs } from 'pinia';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { VFileUpload, VIconBtn } from 'vuetify/labs/components';

import GixRefreshButton from '@/components/GixRefreshButton.vue';
import GixSelectionInfoBar from '@/components/GixSelectionInfoBar.vue';
import { API_CONFIG } from '@/config/api';
import {
  createContract,
  deleteContract,
  editContract,
  getContracts,
} from '@/services/api/contracts';
import { useCompaniesStore } from '@/stores/companies';
import { useContractsStore } from '@/stores/contracts';
import { useSnackbarStore } from '@/stores/snackbar';
import { ActionMode } from '@/types/action-mode';
import { formatDateTime } from '@/utils/formatting';

const contractsStore = useContractsStore();
const { contracts } = storeToRefs(contractsStore);

const companiesStore = useCompaniesStore();
const { companies } = storeToRefs(companiesStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

onMounted(async () => {
  if (!companies.value.length) {
    try {
      await companiesStore.loadCompanies();
    } catch (error) {
      console.error(error);
    }
  }
  await loadContracts();
});

type Contract = Awaited<ReturnType<typeof getContracts>>['payload'][number];

const selectedContract = ref<Contract | null>(null);
const selectedContractIds = ref<number[]>([]);

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
    resetForm();
  } else {
    showCrudDialog.value = !!(selectedContract.value || selectedContractIds.value.length);
    if (newValue === ActionMode.Edit && selectedContract.value) {
      const c = selectedContract.value;
      contractForm.title.value = c.title ?? '';
      contractForm.company.value = c.companyId ?? null;
      contractForm.file.value = undefined;
    }
  }
});

const contractsLoaded = ref(false);

const loadContracts = async () => {
  try {
    contractsLoaded.value = false;
    await contractsStore.loadContracts();
  } catch (error) {
    console.error(error);
    snackbarError.value = true;
    snackbarText.value =
      error instanceof TRPCClientError ? error.message : 'Sözleşmeler yüklenirken bir hata oluştu.';
    snackbar.value = true;
  } finally {
    contractsLoaded.value = true;
  }
};

const uploadProgress = ref('');

const uploadDocument = async (formData: FormData) => {
  const response = await axios.post<{ fileName: string; filePath: string }>(
    `${API_CONFIG.baseURL.replace('/trpc', '')}/file/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total ?? 0),
        );
        uploadProgress.value = `${percentCompleted}%`;
      },
    },
  );
  return response.data;
};

const dialogSubmit = async () => {
  isSubmitting.value = true;

  if (selectedContractIds.value.length && currentMode.value === ActionMode.Delete) {
    await batchDelete();
    return;
  }

  try {
    switch (currentMode.value) {
      case ActionMode.Create:
        const createModeFile = contractForm.file.value;
        if (!createModeFile) {
          snackbarError.value = true;
          snackbarText.value = 'Lütfen bir dosya seçin.';
          snackbar.value = true;
          return;
        }

        const createFormData = new FormData();
        createFormData.append('file', createModeFile);

        const { fileName: createdUploadedFileName } = await uploadDocument(createFormData);

        const createResult = await createContract({
          fileName: createdUploadedFileName,
          title: contractForm.title.value,
          company: contractForm.company.value,
        });
        contractsStore.addContractToList(createResult.createdContract, true);

        snackbarError.value = false;
        snackbarText.value = 'Sözleşme başarıyla oluşturuldu.';
        snackbar.value = true;
        break;
      case ActionMode.Edit:
        if (!selectedContract.value?.id) return;
        const editModeFile = contractForm.file.value;

        let editedUploadedFileName: string | undefined;

        if (editModeFile) {
          const editFormData = new FormData();
          editFormData.append('file', editModeFile);
          editFormData.append('contractId', selectedContract.value.id.toString());
          const { fileName } = await uploadDocument(editFormData);
          editedUploadedFileName = fileName;
        }

        const editResult = await editContract({
          id: selectedContract.value.id,
          title: contractForm.title.value,
          company: contractForm.company.value,
          fileName: editedUploadedFileName,
        });

        contractsStore.updateContractById(
          editResult.updatedContract.id,
          editResult.updatedContract,
        );

        snackbarError.value = false;
        snackbarText.value = 'Sözleşme başarıyla güncellendi.';
        snackbar.value = true;
        break;
      case ActionMode.Delete:
        if (!selectedContract.value?.id) return;

        await deleteContract({ id: selectedContract.value.id });
        contractsStore.removeContractsById([selectedContract.value.id]);

        snackbarError.value = false;
        snackbarText.value = 'Sözleşme başarıyla silindi.';
        snackbar.value = true;
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

const batchDelete = async () => {
  if (!selectedContractIds.value.length) return;

  try {
    await Promise.all(selectedContractIds.value.map((id) => deleteContract({ id })));
    contractsStore.removeContractsById(selectedContractIds.value);

    snackbarError.value = false;
    snackbarText.value = 'Sözleşmeler başarıyla silindi.';
    snackbar.value = true;
  } catch (error) {
    console.error(error);
    snackbarError.value = true;
    snackbarText.value =
      error instanceof TRPCClientError ? error.message : 'Sözleşmeler silinirken bir hata oluştu.';
    snackbar.value = true;
  }
};

// Group contracts by company
const contractsByCompany = computed(() => {
  const grouped = new Map<number | null, Contract[]>();

  contracts.value.forEach((contract) => {
    const companyId = contract.companyId ?? null;
    if (!grouped.has(companyId)) {
      grouped.set(companyId, []);
    }
    grouped.get(companyId)!.push(contract);
  });

  return Array.from(grouped.entries()).map(([companyId, contractList]) => ({
    companyId,
    companyName: getCompanyName(companyId),
    contracts: contractList,
  }));
});

const contractForm = reactive({
  title: { rules: [], value: '' },
  file: { rules: [], value: undefined as File | undefined },
  company: { rules: [], value: null as number | null },
});

const resetForm = () => {
  contractForm.title.value = '';
  contractForm.file.value = undefined;
  contractForm.company.value = null;
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
      return 'Sözleşme Ekle';
    case ActionMode.Edit:
      return 'Sözleşme Düzenle';
    case ActionMode.Delete:
      return 'Sözleşme Sil';
    case ActionMode.Idle:
      return '👋';
    default:
      return currentMode.value;
  }
});

const formValid = computed(() => {
  if (currentMode.value === ActionMode.Create) {
    const file = contractForm.file.value;
    return file !== undefined && (Array.isArray(file) ? file.length > 0 : true);
  }
  if (currentMode.value === ActionMode.Edit) {
    return true; // At least one field should be changed, but we'll allow editing with just title
  }
  return false;
});

const getFileUrl = (fileName: string, thumbnail = false) => {
  const baseUrl = API_CONFIG.baseURL.replace('/trpc', '');
  if (thumbnail) {
    return `${baseUrl}/file/thumbnail/${fileName.replace('.pdf', '.png')}`;
  }
  return `${baseUrl}/file/${fileName}`;
};

const getCompanyName = (companyId: number | null) => {
  if (!companyId) return 'Firma Atanmamış';
  const company = companies.value.find((c) => c.id === companyId);
  return company?.name ?? 'Bilinmeyen Firma';
};

const toggleContractSelection = (contractId: number) => {
  const index = selectedContractIds.value.indexOf(contractId);
  if (index > -1) {
    selectedContractIds.value.splice(index, 1);
  } else {
    selectedContractIds.value.push(contractId);
  }
};

const isContractSelected = (contractId: number) => {
  return selectedContractIds.value.includes(contractId);
};

const openFileInNewTab = (fileName: string) => {
  if (typeof window !== 'undefined') {
    window.open(getFileUrl(fileName), '_blank');
  }
};
</script>

<template>
  <div>
    <v-toolbar flat rounded="lg" class="mb-4 border">
      <v-toolbar-title>
        <v-icon color="medium-emphasis" icon="mdi-file-document" size="x-small" start />
        Sözleşmeler
      </v-toolbar-title>

      <v-spacer />

      <v-btn
        rounded="lg"
        @click="currentMode = ActionMode.Create"
        class="me-3"
        border
        prepend-icon="mdi-file-plus"
      >
        Ekle
      </v-btn>

      <GixRefreshButton :refresh-fn="loadContracts" />
    </v-toolbar>

    <v-progress-linear v-if="!contractsLoaded" indeterminate class="mb-4" />

    <div v-if="contractsLoaded && contracts.length === 0" class="text-center py-12">
      <v-icon size="64" color="grey-lighten-1" icon="mdi-file-document-outline" />
      <p class="text-h6 mt-4 text-grey">Sözleşme bulunamadı</p>
      <v-btn
        rounded="lg"
        @click="currentMode = ActionMode.Create"
        class="mt-4 text-capitalize"
        prepend-icon="mdi-file-plus"
      >
        İlk Sözleşmeyi Ekle
      </v-btn>
    </div>

    <div v-else>
      <div v-for="group in contractsByCompany" :key="group.companyId ?? 'no-company'" class="mb-8">
        <v-card rounded="lg" class="mb-4" variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-domain" class="me-2" />
            {{ group.companyName }}
            <v-chip class="ms-2" size="small" color="primary">
              {{ group.contracts.length }}
            </v-chip>
          </v-card-title>
        </v-card>

        <v-row>
          <v-col
            v-for="contract in group.contracts"
            :key="contract.id"
            cols="12"
            :sm="6"
            :md="4"
            :lg="3"
          >
            <v-card
              rounded="lg"
              class="cursor-pointer overflow-hidden transition-all"
              :class="{
                'contract-selected': isContractSelected(contract.id),
                'contract-card-hover': true,
              }"
              elevation="2"
              hover
              @click="toggleContractSelection(contract.id)"
            >
              <div
                class="position-relative w-100 overflow-hidden contract-image-container"
                style="height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              >
                <img
                  :src="getFileUrl(contract.fileName, true)"
                  loading="lazy"
                  alt="Sözleşme Ön İzlemi"
                  class="w-100 h-100 border-0"
                />
                <div
                  class="position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column justify-space-between pa-2 contract-overlay"
                  style="background: rgba(0, 0, 0, 0.5); opacity: 0; transition: opacity 0.2s ease"
                >
                  <v-checkbox
                    :model-value="isContractSelected(contract.id)"
                    @click.stop="toggleContractSelection(contract.id)"
                    hide-details
                    class="align-self-start"
                  />
                  <div
                    class="d-flex align-self-end rounded-lg pa-1"
                    style="background: rgba(0, 0, 0, 0.6); gap: 4px"
                  >
                    <v-icon-btn
                      icon="mdi-open-in-new"
                      color="white"
                      variant="text"
                      size="small"
                      @click.stop="openFileInNewTab(contract.fileName)"
                    />
                    <v-icon-btn
                      icon="mdi-pencil"
                      color="white"
                      variant="text"
                      size="small"
                      @click.stop="
                        selectedContract = contract;
                        currentMode = ActionMode.Edit;
                      "
                    />
                    <v-icon-btn
                      icon="mdi-trash-can"
                      color="white"
                      variant="text"
                      size="small"
                      @click.stop="
                        selectedContract = contract;
                        currentMode = ActionMode.Delete;
                      "
                    />
                  </div>
                </div>
              </div>
              <v-card-title class="text-body-1 pa-3">
                {{ contract.title }}
              </v-card-title>
              <v-card-subtitle class="pa-3 pt-0">
                <div class="d-flex align-center text-caption text-medium-emphasis">
                  <v-icon size="small" icon="mdi-calendar" class="me-1" />
                  {{ contract.createdAt ? formatDateTime(contract.createdAt, 'dd.MM.yyyy') : '-' }}
                </div>
              </v-card-subtitle>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>
  </div>

  <v-dialog max-width="500" v-model="showCrudDialog" persistent>
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
              label="Başlık"
              autocomplete="off"
              :rules="contractForm.title.rules"
              v-model="contractForm.title.value"
              hint="Boş bırakılırsa dosya adı kullanılır"
              persistent-hint
            />
            <v-file-upload
              class="mb-3"
              variant="outlined"
              rounded="lg"
              title="PDF Dosyası Sürükle ve Bırak"
              density="comfortable"
              clearable
              accept="application/pdf"
              :rules="
                currentMode === ActionMode.Create
                  ? [
                      (v: File | null) => !!v || 'Dosya seçilmelidir.',
                      (v: File | null) =>
                        !v || v.type === 'application/pdf' || 'Sadece PDF dosyaları kabul edilir.',
                    ]
                  : [
                      (v: File | null) =>
                        !v || v.type === 'application/pdf' || 'Sadece PDF dosyaları kabul edilir.',
                    ]
              "
              v-model="contractForm.file.value"
              :required="currentMode === ActionMode.Create"
            />
            <v-autocomplete
              v-model="contractForm.company.value"
              variant="outlined"
              rounded="lg"
              label="Firma"
              autocomplete="off"
              :items="companies"
              item-title="name"
              item-value="id"
              clearable
              prepend-inner-icon="mdi-domain"
            />
          </template>
          <template v-else-if="currentMode === ActionMode.Delete">
            Silinen sözleşmeler geri alınamaz, devam etmek istediğinize emin misiniz?
            <v-divider class="my-3" />
            <div v-if="selectedContract">
              <p><strong>Dosya:</strong> {{ selectedContract.fileName }}</p>
            </div>
          </template>
          <template v-else> 📄 </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn @click="currentMode = ActionMode.Idle" text="İptal" rounded="lg" />
          <v-btn
            type="submit"
            :loading="isSubmitting"
            :disabled="isForm && !formValid"
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
    v-model:selected-ids="selectedContractIds"
    :objects="contracts"
    submit-btn-icon="mdi-trash-can"
    name-property="title"
  />
</template>

<style scoped>
.contract-card-hover {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.contract-card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
}

.contract-card-hover:hover .contract-overlay {
  opacity: 1 !important;
}

.contract-selected {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3) !important;
}
</style>
