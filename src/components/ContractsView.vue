<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

import GixRefreshButton from '@/components/GixRefreshButton.vue';
import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { API_CONFIG } from '@/config/api';
import { useContractsStore } from '@/stores/contracts';
import { useSnackbarStore } from '@/stores/snackbar';
import { formatDateTime } from '@/utils/formatting';

const contractsStore = useContractsStore();
const { contracts } = storeToRefs(contractsStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const contractsLoaded = ref(false);

const loadContracts = async () => {
  contractsLoaded.value = false;
  try {
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

// loading on mount instead of immediate from useCompanyPeriodWatcher
// because the company id takes a while to load into the frontend even though its already there in the backend session
onMounted(async () => {
  await loadContracts();
});

useCompanyPeriodWatcher(loadContracts);

const getFileUrl = (fileName: string, isThumbnail = false) => {
  const baseUrl = API_CONFIG.baseURL.replace('/trpc', '');
  if (isThumbnail) {
    return `${baseUrl}/file/thumbnail/${fileName.replace('.pdf', '.png')}`;
  }
  return `${baseUrl}/file/${fileName}`;
};

const openFileInNewTab = (fileName: string) => {
  if (typeof window !== 'undefined') {
    window.open(getFileUrl(fileName), '_blank');
  }
};
</script>

<template>
  <div>
    <v-toolbar flat rounded="lg" class="border mb-4">
      <v-toolbar-title>
        <v-icon color="medium-emphasis" icon="mdi-file-document" size="x-small" start />
        Sözleşmeler
      </v-toolbar-title>

      <v-progress-linear
        rounded="lg"
        height="3"
        location="bottom"
        absolute
        :active="!contractsLoaded"
        indeterminate
      />

      <v-spacer />

      <GixRefreshButton :refresh-fn="loadContracts" />
    </v-toolbar>

    <div v-if="contractsLoaded && contracts.length === 0" class="text-center py-12">
      <v-icon size="64" color="grey-lighten-1" icon="mdi-file-document-outline" />
      <p class="text-h6 mt-4 text-grey">Sözleşme bulunamadı</p>
    </div>

    <v-row v-else>
      <v-col v-for="contract in contracts" :key="contract.id" cols="12" :sm="6" :md="4" :lg="3">
        <v-card
          rounded="lg"
          class="cursor-pointer overflow-hidden transition-all contract-card-hover"
          elevation="2"
          hover
          @click="openFileInNewTab(contract.fileName)"
        >
          <div
            class="position-relative w-100 overflow-hidden"
            style="height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          >
            <img
              :src="getFileUrl(contract.fileName, true)"
              loading="lazy"
              alt="Sözleşme Ön İzlemi"
              class="w-100 h-100 border-0"
            />
            <div
              class="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-center justify-center contract-overlay"
              style="background: rgba(0, 0, 0, 0.5); opacity: 0; transition: opacity 0.2s ease"
            >
              <v-icon size="48" color="white" icon="mdi-open-in-new" />
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
</style>
