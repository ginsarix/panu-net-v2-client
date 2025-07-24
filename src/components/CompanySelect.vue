<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';

import { setSelectedCompany } from '@/services/api/companies.ts';
import emitter from '@/services/service-bus.ts';
import { useAsyncGateStore } from '@/stores/async-gate';
import { useCompaniesStore } from '@/stores/companies.ts';
import { useAppOptionsStore } from '@/stores/options.ts';
import { useSnackbarStore } from '@/stores/snackbar.ts';

const asyncGate = useAsyncGateStore();

const { appOptions } = storeToRefs(useAppOptionsStore());

const companiesStore = useCompaniesStore();
const { companies, selectedCompanyId } = storeToRefs(companiesStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarText, snackbarError } = storeToRefs(snackbarStore);

const menu = ref(false);
const selectCompanyLoading = ref(false);
const noDataText = ref('Şirketler bulunamadı');

const skipWatch = ref(false);

const loadCompanies = async (giveCacheFeedback = true) => {
  const cacheFeedbackPreference = appOptions.value.giveCacheFeedback;
  appOptions.value.giveCacheFeedback = giveCacheFeedback;

  try {
    appOptions.value.giveCacheFeedback = false;
    await companiesStore.loadCompanies();
  } catch (error) {
    noDataText.value = 'Beklenmedik birşey oldu.';
    console.error(error);
  } finally {
    appOptions.value.giveCacheFeedback = cacheFeedbackPreference;
  }
};

const loadSelectedCompanyId = async () => {
  try {
    skipWatch.value = true;
    await companiesStore.loadSelectedCompanyId();

    asyncGate.markReady();
  } catch (error) {
    console.error(error);
  } finally {
    skipWatch.value = false;
  }
};

onMounted(async () => {
  await loadCompanies(false);
  await loadSelectedCompanyId();
  selectedCompanyIdPassthrough.value = selectedCompanyId.value;
});

emitter.on('companyNotSelected', () => {
  if (!selectedCompanyId) return;

  snackbarError.value = true;
  snackbarText.value = 'Lütfen şirket seçiniz.';
  snackbar.value = true;

  menu.value = true;
});

// this is so that failed selections dont affect the original state
// not even for a little bit because of the emitter above, the error messages overlap.
const selectedCompanyIdPassthrough = ref<number | null>(null);

watch(selectedCompanyIdPassthrough, async (newValue) => {
  if (newValue === null || skipWatch.value) return;

  selectCompanyLoading.value = true;

  try {
    await setSelectedCompany(newValue);
    selectedCompanyId.value = newValue;
  } catch (error) {
    console.error(error);

    selectedCompanyId.value = null;
    selectedCompanyIdPassthrough.value = null;

    const errorText =
      error instanceof TRPCClientError
        ? error.message
        : 'Şirket seçilemedi, daha sonra tekrar deneyiniz.';

    snackbarError.value = true;
    snackbarText.value = errorText;
    snackbar.value = true;
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 800));
    selectCompanyLoading.value = false;
  }
});
</script>

<template>
  <v-select
    :loading="selectCompanyLoading"
    append-inner-icon="mdi-domain"
    v-model="selectedCompanyIdPassthrough"
    v-model:menu="menu"
    :items="companies"
    item-title="name"
    item-value="id"
    clearable
    label="Firma"
    :no-data-text="noDataText"
    class="mt-4 me-5"
    variant="underlined"
    max-width="300"
  />
</template>
