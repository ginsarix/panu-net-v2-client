<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { VIconBtn, VMaskInput } from 'vuetify/labs/components';

import GixSelectionInfoBar from '@/components/GixSelectionInfoBar.vue';
import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import {
  type UserServerDataTableOptions,
  createUser,
  deleteUser,
  deleteUsers,
  patchUser,
} from '@/services/api/users.ts';
import { useCompaniesStore } from '@/stores/companies';
import { useDisplayStore } from '@/stores/display.ts';
import { useAppOptionsStore } from '@/stores/options.ts';
import { useSnackbarStore } from '@/stores/snackbar';
import { useUsersStore } from '@/stores/users.ts';
import { ActionMode } from '@/types/action-mode.ts';
import type { DataTableHeaders } from '@/types/data-table-headers.ts';
import type { User } from '@/types/user.ts';
import {
  emailRules,
  noEmptyArrayRule,
  noEmptyRule,
  passwordRules,
  phoneRules,
} from '@/types/validations.ts';
import { formatDateTime } from '@/utils/formatting.ts';

import DataTableInfo from '../DataTableInfo.vue';
import GixRefreshButton from '../GixRefreshButton.vue';

const { mobile } = storeToRefs(useDisplayStore());

const appOptionsStore = useAppOptionsStore();
const { appOptions } = storeToRefs(appOptionsStore);

const usersStore = useUsersStore();
const { users, totalUsersCount } = storeToRefs(usersStore);

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
});

const selectedUser = ref<User | null>(null);
const selectedUserIds = ref<number[]>([]);

const currentMode = ref(ActionMode.Idle);
const showCrudDialog = computed(() => {
  if (currentMode.value === ActionMode.Idle) return false;

  if (currentMode.value === ActionMode.Create) return true;

  return !!(selectedUser.value || selectedUserIds.value.length);
});

const usersLoaded = ref(false);

const loadUsers = async (options?: UserServerDataTableOptions, giveCacheFeedback = true) => {
  const cacheFeedbackPreference = appOptions.value.giveCacheFeedback;
  appOptions.value.giveCacheFeedback = giveCacheFeedback;
  try {
    await usersStore.loadUsers(options);
  } catch (error) {
    console.error(error);
  } finally {
    usersLoaded.value = true;

    appOptions.value.giveCacheFeedback = cacheFeedbackPreference;
  }
};

const dialogSubmit = async () => {
  isSubmitting.value = true;

  if (selectedUserIds.value.length && currentMode.value === ActionMode.Delete) {
    await batchDelete();
    return;
  }

  const formUser = () => {
    return {
      name: userForm.name.value,
      email: userForm.email.value,
      password: userForm.password.value,
      role: userForm.role.value,
      companies: userForm.userCompanies.value,
    };
  };

  const willUpdateNextRefreshText = 'Sonraki güncellemede yenilenecektir';

  try {
    switch (currentMode.value) {
      case ActionMode.Create:
        const user = formUser();

        const createPasswordConfirmed = user.password === userForm.passwordAgain.value;
        if (createPasswordConfirmed) {
          await createUser(user);

          const latestUserId = users.value[0].id;

          const displayUser = {
            ...user,
            id: latestUserId ? latestUserId + 1 : latestUserId,
            creationDate: willUpdateNextRefreshText,
          };
          usersStore.addUserToList(displayUser, true);
        }
        break;
      case ActionMode.Edit:
        if (!selectedUser.value?.id) return;
        const editedUser = formUser();

        const editPasswordConfirmed = editedUser.password === userForm.passwordAgain.value;

        if (!editPasswordConfirmed) return;

        await patchUser(selectedUser.value.id, editedUser);

        const displayedEditedUser = {
          ...selectedUser.value,
          ...Object.fromEntries(Object.entries(editedUser).filter(([, v]) => v !== '')),
          updatedOn: willUpdateNextRefreshText,
        };
        usersStore.updateUserById(selectedUser.value.id, displayedEditedUser);
        break;
      case ActionMode.Delete:
        if (!selectedUser.value?.id) return;

        await deleteUser(selectedUser.value.id);
        usersStore.removeUsersById([selectedUser.value.id]);
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
  if (!selectedUserIds.value.length) return;

  try {
    await deleteUsers(selectedUserIds.value);
    usersStore.removeUsersById(selectedUserIds.value);
  } catch (error) {
    console.error(error);
  }
};

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'ID', key: 'id', sortable: true, toggled: true },
  { title: 'Ad', key: 'name', sortable: true, toggled: true },
  { title: 'E-posta', key: 'email', sortable: false, toggled: true },
  { title: 'Rol', key: 'role', sortable: true, toggled: true },
  { title: 'Telefon', key: 'phone', sortable: false, toggled: true },
  { title: 'Oluşturulma Tarihi', key: 'creationDate', sortable: true, toggled: true },
  { title: 'Düzenlenme Tarihi', key: 'updatedOn', sortable: true, toggled: true },
  { title: 'İşlemler', key: 'actions', sortable: false, toggled: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

const userForm = reactive({
  name: { rules: [noEmptyRule], value: '' },
  email: { rules: emailRules, value: '' },
  password: { rules: passwordRules, value: '' },
  passwordAgain: { rules: passwordRules, value: '' },
  phone: { rules: phoneRules, value: '' },
  role: { rules: [noEmptyRule], value: 'user' },
  userCompanies: { rules: [noEmptyArrayRule], value: [] as number[] },
});

const resetForm = () => {
  Object.values(userForm).forEach((field) => {
    if (typeof field.value === 'string') field.value = '';
    else if (Array.isArray(field.value)) field.value = [];
  });
};

const companySelectHidden = ref(false);
const showPassword = ref(false);
const showPasswordAgain = ref(false);

watch(
  () => userForm.role.value,
  (newValue) => {
    const isAdmin = newValue === 'admin';
    companySelectHidden.value = isAdmin;
    userForm.userCompanies.rules = isAdmin ? [] : [noEmptyArrayRule];
  },
);

const passwordAgainErrorMessage = computed(() =>
  userForm.passwordAgain.value !== userForm.password.value ? 'Parolalar eşleşmiyor.' : '',
);

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

const validateField = (field: (typeof userForm)[keyof typeof userForm]) =>
  //                                             fuck you typescript
  field.rules.every((rule) => rule(field.value as never) === true);

const formValid = computed(
  () =>
    Object.values(userForm).every((field) => validateField(field)) &&
    passwordAgainErrorMessage.value === '',
);
const editFormValid = computed(
  () =>
    Object.values(userForm).some((field) => validateField(field)) &&
    passwordAgainErrorMessage.value === '',
);
</script>

<template>
  <v-data-table-server
    v-model="selectedUserIds"
    @update:options="(options) => loadUsers(options, false)"
    :headers="includedDataTableHeaders"
    :items-length="totalUsersCount"
    :items="users"
    :loading="!usersLoaded"
    class="rounded-lg elevation-0 border"
    fixed-header
    hover
    :mobile="mobile.value"
    loading-text="Kullanıcılar yükleniyor..."
    no-data-text="Kullanıcılar bulunamadı."
    items-per-page-text="Sayfa başı kullanıcılar"
    show-select
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text-account" size="x-small" start />
          Kullanıcılar
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
          prepend-icon="mdi-account-plus"
        >
          Ekle
        </v-btn>

        <GixRefreshButton :refresh-fn="() => loadUsers()" />
        <DataTableInfo class="me-5" />
      </v-toolbar>
    </template>
    <template #[`item.role`]="{ item }">
      {{ item.role === 'admin' ? 'Admin' : 'Kullanıcı' }}
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
            selectedUser = item;
            currentMode = ActionMode.Edit;
          "
        />
        <v-icon-btn
          icon="mdi-trash-can"
          color="error"
          variant="text"
          @click.stop="
            selectedUser = item;
            currentMode = ActionMode.Delete;
          "
        />
      </div>
    </template>
  </v-data-table-server>

  <v-dialog max-width="450" v-model="showCrudDialog">
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
              label="Ad"
              :rules="userForm.name.rules"
              v-model="userForm.name.value"
            />
            <v-text-field
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="E-posta"
              type="email"
              :rules="userForm.email.rules"
              v-model="userForm.email.value"
            />
            <v-mask-input
              class="mb-2"
              mask="phone"
              placeholder="(###) ### - ####"
              variant="outlined"
              rounded="lg"
              label="Telefon"
              :rules="userForm.phone.rules"
              v-model="userForm.phone.value"
            />
            <v-card class="mt-2 mb-6" rounded="lg" border>
              <v-card-text class="pb-0">
                <v-radio-group label="Yetki" v-model="userForm.role.value">
                  <v-radio value="user" label="Kullanıcı" />
                  <v-radio value="admin" label="Admin" />
                </v-radio-group>

                <v-expand-transition class="mb-2">
                  <v-autocomplete
                    v-model="userForm.userCompanies.value"
                    v-show="!companySelectHidden"
                    variant="outlined"
                    multiple
                    chips
                    label="Firmalar"
                    :items="companies"
                    :rules="userForm.userCompanies.rules"
                    item-title="name"
                    item-value="id"
                  />
                </v-expand-transition>
              </v-card-text>
            </v-card>

            <v-text-field
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="Parola"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              :rules="userForm.password.rules"
              v-model="userForm.password.value"
            />
            <v-text-field
              class="mb-2"
              variant="outlined"
              rounded="lg"
              label="Tekrardan Parola"
              :type="showPasswordAgain ? 'text' : 'password'"
              :append-inner-icon="showPasswordAgain ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPasswordAgain = !showPasswordAgain"
              :rules="userForm.passwordAgain.rules"
              :error-messages="passwordAgainErrorMessage"
              v-model="userForm.passwordAgain.value"
            />
          </template>
          <template v-else-if="currentMode === ActionMode.Delete">
            Silinen kullanıcılar geri alınamaz, devam etmek istediğinize emin misiniz?
          </template>
          <template v-else> 🧑‍💻 </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn
            @click="
              () => {
                currentMode = ActionMode.Idle;
                resetForm();
              }
            "
            text="İptal"
            rounded="lg"
          />
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
    v-model:selected-ids="selectedUserIds"
    :objects="users"
    submit-btn-icon="mdi-trash-can"
  />
</template>
