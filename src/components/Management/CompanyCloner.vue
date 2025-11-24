<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { reactive, ref } from 'vue';

import { createCompany } from '@/services/api/companies';
import { useCompaniesStore } from '@/stores/companies';
import { useSnackbarStore } from '@/stores/snackbar';
import type { Company } from '@/types/company';

defineProps<{
  companies: Company[];
}>();

const companiesStore = useCompaniesStore();
const snackbarStore = useSnackbarStore();
const { snackbar, snackbarText, snackbarError } = storeToRefs(snackbarStore);

const alert = reactive({
  active: false,
  message: '',
});

const setAlert = (active: boolean, message: string) => {
  alert.active = active;
  alert.message = message;
};

const selectedCompany = ref<Company | null>(null);
const companyCode = ref<number | null>(null);
const isSubmitting = ref(false);
const showDialog = ref(false);

const resetForm = () => {
  selectedCompany.value = null;
  companyCode.value = null;
  setAlert(false, '');
};

const validateCompanyCode = (code: number | null) => {
  if (code === null) {
    return 'Firma kodu boş bırakılamaz';
  }

  if (!Number.isInteger(code)) {
    return 'Firma kodu tam sayı olmalıdır';
  }

  if (code <= 0) {
    return 'Firma kodu pozitif bir sayı olmalıdır';
  }

  return null;
};

const submit = async () => {
  const validationError = validateCompanyCode(companyCode.value);

  if (validationError) {
    setAlert(true, validationError);
    return;
  }

  setAlert(false, '');

  isSubmitting.value = true;
  try {
    await cloneCompany(companyCode.value!);

    snackbarError.value = false;
    snackbarText.value = 'Firma başarıyla klonlandı';
    snackbar.value = true;

    showDialog.value = false;
  } catch (error) {
    setAlert(true, 'Firma klonlanırken beklenmeyen bir hata oluştu');
    console.error(error);
  } finally {
    isSubmitting.value = false;
  }
};

const cloneCompany = async (code: number) => {
  const constructedCompany: Company = { ...selectedCompany.value!, code };

  const serverValues = await createCompany(constructedCompany);
  companiesStore.addCompanyToList({ ...constructedCompany, ...serverValues }, true);
};
</script>

<template>
  <v-dialog v-model="showDialog" @after-leave="resetForm" max-width="500">
    <template #activator="{ props }">
      <v-btn
        v-bind="{ ...props, ...$attrs }"
        rounded="lg"
        class="me-3"
        border
        prepend-icon="mdi-content-duplicate"
        >Klonla</v-btn
      >
    </template>
    <v-card rounded="lg" title="Firma Klonla">
      <v-form @submit.prevent="submit">
        <v-card-text class="pt-0">
          <v-alert
            class="mb-5"
            v-model="alert.active"
            closable
            type="error"
            variant="tonal"
            :text="alert.message"
          />
          <v-row>
            <v-col cols="3">
              <v-text-field
                label="Kod"
                autocomplete="off"
                variant="outlined"
                type="text"
                pattern="[0-9]*"
                inputmode="numeric"
                v-model.number="companyCode"
              />
            </v-col>
            <v-col>
              <v-autocomplete
                v-model="selectedCompany"
                label="Firma"
                variant="outlined"
                item-title="name"
                autocomplete="off"
                return-object
                :items="companies"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn
            color="primary"
            rounded="lg"
            :loading="isSubmitting"
            text="Klonla"
            type="submit"
            :disabled="!selectedCompany || !companyCode || isSubmitting"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
