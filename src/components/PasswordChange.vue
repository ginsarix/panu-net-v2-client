<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { computed, reactive, ref } from 'vue';

import { changePassword } from '@/services/api/auth';
import { passwordRules } from '@/types/validations';

const passwordChangeForm = reactive({
  currentPassword: { rules: passwordRules, value: '' },
  newPassword: { rules: passwordRules, value: '' },
  newPasswordAgain: { rules: [], value: '' },
});

const validateField = (field: (typeof passwordChangeForm)[keyof typeof passwordChangeForm]) =>
  field.rules.every((rule) => rule(field.value) === true);

const formValid = computed(() =>
  Object.values(passwordChangeForm).every((field) => validateField(field)),
);

const alert = ref(false);
const alertType = ref<'error' | 'success'>('error');
const alertMessage = ref('');

const isSubmitting = ref(false);

const submit = async () => {
  if (!formValid.value) return;

  isSubmitting.value = true;
  try {
    const result = await changePassword(
      passwordChangeForm.currentPassword.value,
      passwordChangeForm.newPassword.value,
    );

    alertMessage.value = result.message;
    alertType.value = 'success';
    alert.value = true;
  } catch (error) {
    console.error(error);

    alertMessage.value =
      error instanceof TRPCClientError ? error.message : 'Şifre değiştirilirken bir hata oluştu.';
    alertType.value = 'error';
    alert.value = true;
  } finally {
    isSubmitting.value = false;
  }
};

const passwordAgainErrorMessage = computed(() =>
  passwordChangeForm.newPasswordAgain.value !== passwordChangeForm.newPassword.value
    ? 'Parolalar eşleşmiyor.'
    : '',
);

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showNewPasswordAgain = ref(false);
</script>

<template>
  <v-form @submit.prevent="submit">
    <v-alert
      v-model="alert"
      closable
      :text="alertMessage"
      class="mb-4"
      :type="alertType"
      variant="tonal"
    />
    <v-text-field
      v-model="passwordChangeForm.currentPassword.value"
      density="comfortable"
      :rules="passwordChangeForm.currentPassword.rules"
      label="Şifreniz"
      variant="outlined"
      :type="showCurrentPassword ? 'text' : 'password'"
      :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
      @click:append-inner="showCurrentPassword = !showCurrentPassword"
      rounded="lg"
    />
    <v-text-field
      v-model="passwordChangeForm.newPassword.value"
      density="comfortable"
      :rules="passwordChangeForm.newPassword.rules"
      label="Yeni Şifreniz"
      variant="outlined"
      :type="showNewPassword ? 'text' : 'password'"
      :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
      @click:append-inner="showNewPassword = !showNewPassword"
      rounded="lg"
    />
    <v-text-field
      v-model="passwordChangeForm.newPasswordAgain.value"
      density="comfortable"
      label="Yeni Şifreniz Tekrar"
      :error-messages="passwordAgainErrorMessage"
      variant="outlined"
      :type="showNewPasswordAgain ? 'text' : 'password'"
      :append-inner-icon="showNewPasswordAgain ? 'mdi-eye-off' : 'mdi-eye'"
      @click:append-inner="showNewPasswordAgain = !showNewPasswordAgain"
      rounded="lg"
    />
    <div class="d-flex justify-end">
      <v-btn
        type="submit"
        :loading="isSubmitting"
        append-icon="mdi-lock-reset"
        text="Tamam"
        rounded="lg"
      />
    </div>
  </v-form>
</template>
