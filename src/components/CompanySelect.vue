<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { watchDebounced } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

import { setSelectedCompany } from '@/services/api/companies.ts';
import emitter from '@/services/service-bus.ts';
import { useCompaniesStore } from '@/stores/companies.ts';
import { useSnackbarStore } from '@/stores/snackbar.ts';

import PeriodSelector from './PeriodSelector.vue';

const companiesStore = useCompaniesStore();
const { companies, creditCount, selectedCompanyId } = storeToRefs(companiesStore);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarText, snackbarError } = storeToRefs(snackbarStore);

const menu = ref(false);
const selectCompanyLoading = ref(false);
const noDataText = ref('Şirketler bulunamadı');

const skipWatch = ref(false);

const loadCompanies = async () => {
  try {
    await companiesStore.loadCompanies();
  } catch (error) {
    noDataText.value = 'Beklenmedik bir hata oluştu.';
    console.error(error);
  }
};

const loadSelectedCompanyId = async () => {
  try {
    skipWatch.value = true;
    await companiesStore.loadSelectedCompanyId();
  } catch (error) {
    console.error(error);
  } finally {
    skipWatch.value = false;
  }
};

onMounted(async () => {
  await loadCompanies();
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

watchDebounced(
  selectedCompanyIdPassthrough,
  async (newValue) => {
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
      await new Promise((resolve) => setTimeout(resolve, 700));
      selectCompanyLoading.value = false;
    }
  },
  { debounce: 300 },
);
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
    @click:clear="selectedCompanyIdPassthrough = null"
    label="Firma"
    :no-data-text="noDataText"
    class="mt-4 me-4"
    variant="underlined"
    max-width="250"
  >
    <template #item="{ props: itemProps, item }">
      <v-list-item
        v-bind="itemProps"
        :subtitle="`${item.raw.webServiceSource.replace('https://', '')}`"
      /> </template
  ></v-select>

  <v-expand-x-transition v-show="selectedCompanyIdPassthrough">
    <PeriodSelector class="mt-1 me-3" />
  </v-expand-x-transition>
  <v-expand-x-transition v-show="selectedCompanyIdPassthrough">
    <span class="text-overline mt-3 me-3 text-no-wrap">
      Kontör:
      {{ creditCount }}
    </span>
  </v-expand-x-transition>
</template>
