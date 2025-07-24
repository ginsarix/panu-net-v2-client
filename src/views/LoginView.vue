<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { VIconBtn } from 'vuetify/labs/components';

import { login, verifyEmail } from '@/services/api/auth';
import { useCurrentUserStore } from '@/stores/current-user';
import { emailRules, passwordRules } from '@/types/validations.ts';

const currentUserStore = useCurrentUserStore();

const email = ref('');
const password = ref('');
const otpIdentifier = ref('');
const otp = ref('');
const otpValidating = ref(false);
const otpErrorMessage = ref('');

const showPassword = ref(false);
const loginSubmitting = ref(false);
const errorMessage = ref('');
const formSubmitted = ref(false);

const isEmailValid = computed(() => {
  if (!formSubmitted.value && !email.value) return true;
  return emailRules.every((rule) => rule(email.value) === true);
});

const isPasswordValid = computed(() => {
  if (!formSubmitted.value && !password.value) return true;
  return passwordRules.every((rule) => rule(password.value) === true);
});

const isFormValid = computed(() => {
  return isEmailValid.value && isPasswordValid.value;
});

const router = useRouter();

const submit = async () => {
  formSubmitted.value = true;

  if (!isFormValid.value) {
    return;
  }

  loginSubmitting.value = true;
  errorMessage.value = '';

  try {
    const result = await login(email.value, password.value);

    if ('otpIdentifier' in result) otpIdentifier.value = result.otpIdentifier;
    else if ('success' in result) {
      await currentUserStore.loadCurrentUser();

      await new Promise((resolve) => setTimeout(resolve, 500));
      await router.push('/');
    } else location.reload();
  } catch (error) {
    console.error('Login submit failed:', error);

    if (error instanceof TRPCClientError) errorMessage.value = error.message;
  } finally {
    loginSubmitting.value = false;
  }
};

const otpSubmit = async () => {
  if (!otpIdentifier.value) return;

  try {
    otpValidating.value = true;

    await verifyEmail(otpIdentifier.value, otp.value);

    await currentUserStore.loadCurrentUser();

    await new Promise((resolve) => setTimeout(resolve, 500));
    await router.push('/');
  } catch (error) {
    console.error('OTP Submit failed: ', error);
    if (error instanceof TRPCClientError) otpErrorMessage.value = error.message;
  } finally {
    otpValidating.value = false;
  }
};

const resetOtp = () => {
  otpIdentifier.value = '';
  otp.value = '';
  otpValidating.value = false;
  otpErrorMessage.value = '';
};
</script>

<template>
  <div class="d-flex justify-center align-center" style="min-height: 80vh">
    <v-card
      :prepend-icon="otpIdentifier ? 'mdi-two-factor-authentication' : 'mdi-login-variant'"
      :title="otpIdentifier ? 'E-posta Doğrulama' : 'Giriş'"
      elevation="5"
      width="450"
    >
      <v-card-text>
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          closable
          class="mb-5"
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <v-form v-if="!otpIdentifier" class="mt-3" @submit.prevent="submit">
          <v-text-field
            v-model="email"
            variant="outlined"
            prepend-inner-icon="mdi-email"
            label="E-posta"
            class="mb-3"
            :rules="emailRules"
            autocomplete="email"
            required
          />

          <v-text-field
            v-model="password"
            variant="outlined"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :type="showPassword ? 'text' : 'password'"
            label="Şifre"
            :rules="passwordRules"
            autocomplete="current-password"
            @click:append-inner="showPassword = !showPassword"
            required
          />

          <div class="d-flex justify-end mt-4">
            <v-btn
              variant="flat"
              size="large"
              type="submit"
              :loading="loginSubmitting"
              :disabled="!isFormValid && formSubmitted"
              append-icon="mdi-login"
            >
              Devam
            </v-btn>
          </div>
        </v-form>
        <template v-else>
          <v-row no-gutters>
            <v-col cols="12">
              <v-otp-input
                v-model="otp"
                @finish="otpSubmit"
                :loading="otpValidating"
                :error="!!otpErrorMessage"
              />
            </v-col>
            <v-col cols="12" class="text-center">
              <span class="text-h6 text-error">{{ otpErrorMessage }}</span>
            </v-col>
          </v-row>

          <p class="text-medium-emphasis">
            E-postanıza 6 haneli bir kod gönderildi, devam etmek için gelen kutunuza veya spam
            klasörüne gelen kodu doğrulayınız.
          </p>
          <v-icon-btn class="mt-3" icon="mdi-arrow-left" variant="plain" @click="resetOtp" />
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>
