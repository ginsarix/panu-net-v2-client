<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { VIconBtn } from 'vuetify/labs/components';

import GixCountdown from '@/components/GixCountdown.vue';
import { login, resetPassword, verifyEmail, verifyPasswordReset } from '@/services/api/auth';
import { useCurrentUserStore } from '@/stores/current-user';
import { useSnackbarStore } from '@/stores/snackbar';
import { emailRules, passwordRules } from '@/types/validations.ts';
import { normalizeEmail } from '@/utils/formatting';

const currentUserStore = useCurrentUserStore();

const email = ref('');
const password = ref('');
const otpIdentifier = ref('');
const otp = ref('');
const otpTtl = ref(0);
const otpValidating = ref(false);
const otpErrorMessage = ref('');

const showPassword = ref(false);
const loginSubmitting = ref(false);
const errorMessage = ref('');
const formSubmitted = ref(false);

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarText, snackbarError } = storeToRefs(snackbarStore);

const showPasswordResetModal = ref(false);

const isEmailValid = computed(() => {
  if (!formSubmitted.value && !email.value) return true;
  const normalizedEmail = email.value ? normalizeEmail(email.value) : '';
  return emailRules.every((rule) => rule(normalizedEmail) === true);
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

  if (email.value) {
    email.value = normalizeEmail(email.value);
  }

  if (!isFormValid.value) {
    return;
  }

  loginSubmitting.value = true;
  errorMessage.value = '';

  try {
    const result = await login(email.value, password.value);

    if ('otpIdentifier' in result && result.otpIdentifier) {
      otpIdentifier.value = result.otpIdentifier;
      otpTtl.value = result.ttl;
    } else if ('success' in result) {
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

const passwordResetEmail = ref('');
const newPassword = ref('');
const showNewPassword = ref(false);
const passwordResetOtpIdentifier = ref('');
const passwordResetOtp = ref('');
const passwordResetOtpTtl = ref(0);
const passwordResetOtpValidating = ref(false);
const passwordResetOtpErrorMessage = ref('');

const resetPasswordSubmit = () => {
  // Normalize email before submission
  if (passwordResetEmail.value) {
    passwordResetEmail.value = normalizeEmail(passwordResetEmail.value);
  }

  resetPassword(passwordResetEmail.value, newPassword.value)
    .then(({ otpIdentifier, ttl }) => {
      passwordResetOtpIdentifier.value = otpIdentifier;
      passwordResetOtpTtl.value = ttl;
    })
    .catch((error) => console.error(error));
};

const resetPasswordOtpSubmit = async () => {
  if (!passwordResetOtpIdentifier.value) return;

  try {
    passwordResetOtpValidating.value = true;

    await verifyPasswordReset(passwordResetOtpIdentifier.value, passwordResetOtp.value);

    await new Promise((resolve) => setTimeout(resolve, 500));

    resetPasswordResetOtp();
    showPasswordResetModal.value = false;

    snackbarError.value = false;
    snackbarText.value = 'Parolanız başarıyla değiştirildi.';
    snackbar.value = true;
  } catch (error) {
    console.error('Password reset OTP submit failed: ', error);
    if (error instanceof TRPCClientError) passwordResetOtpErrorMessage.value = error.message;
  } finally {
    passwordResetOtpValidating.value = false;
  }
};

const resetPasswordResetOtp = () => {
  passwordResetOtpIdentifier.value = '';
  passwordResetOtp.value = '';
  passwordResetOtpValidating.value = false;
  passwordResetOtpErrorMessage.value = '';
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
          <v-btn @click="showPasswordResetModal = true" variant="text" color="blue-lighten-2"
            >Şifremi unuttum</v-btn
          >

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
          <GixCountdown @over="resetOtp" v-model="otpTtl" />

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

  <v-dialog v-model="showPasswordResetModal" max-width="450">
    <v-form @submit.prevent="resetPasswordSubmit">
      <v-card prepend-icon="mdi-lock-reset" :title="'Parolanı sıfırla'" rounded="lg">
        <v-card-text>
          <template v-if="!passwordResetOtpIdentifier">
            <v-text-field
              v-model="passwordResetEmail"
              variant="outlined"
              prepend-inner-icon="mdi-email"
              label="E-posta"
              class="mb-3"
              :rules="emailRules"
              autocomplete="email"
              required
            />

            <v-text-field
              v-model="newPassword"
              variant="outlined"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
              :type="showNewPassword ? 'text' : 'password'"
              label="Yeni Şifre"
              :rules="passwordRules"
              autocomplete="current-password"
              @click:append-inner="showNewPassword = !showNewPassword"
              required
            />
          </template>
          <template v-else>
            <GixCountdown v-model="passwordResetOtpTtl" />

            <v-row no-gutters>
              <v-col cols="12">
                <v-otp-input
                  v-model="passwordResetOtp"
                  @finish="resetPasswordOtpSubmit"
                  :loading="passwordResetOtpValidating"
                  :error="!!passwordResetOtpErrorMessage"
                />
              </v-col>
              <v-col cols="12" class="text-center">
                <span class="text-h6 text-error">{{ passwordResetOtpErrorMessage }}</span>
              </v-col>
            </v-row>
            <p class="text-medium-emphasis">
              E-postanıza 6 haneli bir kod gönderildi, parolanızı sıfırlamaya devam etmek için gelen
              kutunuza veya spam klasörüne gelen kodu doğrulayınız.
            </p>
          </template>
        </v-card-text>

        <v-card-actions>
          <v-btn type="submit" append-icon="mdi-chevron-right">Devam</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>
