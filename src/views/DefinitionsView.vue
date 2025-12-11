<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, onMounted, reactive, ref } from 'vue';

import GixRefreshButton from '@/components/GixRefreshButton.vue';
import {
  createDefinition,
  deleteDefinition,
  getDefinition,
  getDefinitions,
  updateDefinition,
} from '@/services/api/definitions';
import { useSnackbarStore } from '@/stores/snackbar';
import { noEmptyRule } from '@/types/validations';

type DefinitionSummary = Awaited<ReturnType<typeof getDefinitions>>['definitions'][number];
type FullDefinition = Awaited<ReturnType<typeof getDefinition>>['definition'];

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const definitionSummaries = ref<DefinitionSummary[]>([]);
const selectedDefinition = ref<FullDefinition | null>(null);
const selectedDefinitionId = ref<number | null>(null);
const isSubmitting = ref(false);
const isLoadingDefinition = ref(false);
const showDeleteDialog = ref(false);

const socialPlatforms = [
  { key: 'facebook', label: 'Facebook', icon: 'mdi-facebook', linkKey: 'facebookLink' },
  { key: 'twitter', label: 'Twitter', icon: 'mdi-twitter', linkKey: 'twitterLink' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'mdi-linkedin', linkKey: 'linkedinLink' },
  { key: 'instagram', label: 'Instagram', icon: 'mdi-instagram', linkKey: 'instagramLink' },
  { key: 'youtube', label: 'YouTube', icon: 'mdi-youtube', linkKey: 'youtubeLink' },
] as const;

type SocialPlatform = (typeof socialPlatforms)[number];
type SocialToggleKey = SocialPlatform['key'];
type SocialLinkKey = SocialPlatform['linkKey'];
type SocialLinksForm = Record<SocialToggleKey, boolean> & Record<SocialLinkKey, string>;

const getDefaultSocialLinks = (): SocialLinksForm => ({
  facebook: false,
  facebookLink: '',
  twitter: false,
  twitterLink: '',
  linkedin: false,
  linkedinLink: '',
  instagram: false,
  instagramLink: '',
  youtube: false,
  youtubeLink: '',
});

const definitionForm = reactive({
  name: '',
  paymentLink: '',
  socialLinks: getDefaultSocialLinks(),
});

const autocompleteItems = computed(() =>
  definitionSummaries.value.map((def) => ({
    title: def.name,
    value: def.id,
  })),
);

const formValid = computed(() => {
  return !!definitionForm.name.trim();
});

const socialLinkRules = (toggleKey: SocialToggleKey) => [
  (value: string) => !definitionForm.socialLinks[toggleKey] || !!value || 'Link gerekli.',
];

const loadDefinitionSummaries = async () => {
  try {
    const response = await getDefinitions();
    definitionSummaries.value = response.definitions;
  } catch (error) {
    console.error(error);
    snackbarError.value = true;
    snackbarText.value =
      error instanceof TRPCClientError ? error.message : 'Tanımlar yüklenirken bir hata oluştu.';
    snackbar.value = true;
  }
};

const loadFullDefinition = async (id: number) => {
  isLoadingDefinition.value = true;
  try {
    const response = await getDefinition({ id });
    selectedDefinition.value = response.definition;
    selectedDefinitionId.value = id;
    fillFormWithDefinition();
  } catch (error) {
    console.error(error);
    snackbarError.value = true;
    snackbarText.value =
      error instanceof TRPCClientError
        ? error.message
        : 'Tanım detayları yüklenirken bir hata oluştu.';
    snackbar.value = true;
  } finally {
    isLoadingDefinition.value = false;
  }
};

const fillFormWithDefinition = () => {
  if (!selectedDefinition.value) {
    resetForm();
    return;
  }

  definitionForm.name = selectedDefinition.value.name ?? '';
  definitionForm.paymentLink = selectedDefinition.value.paymentLink ?? '';

  const socialLinks = selectedDefinition.value.socialLinks as Partial<SocialLinksForm> | undefined;
  socialPlatforms.forEach(({ key, linkKey }) => {
    definitionForm.socialLinks[key] = socialLinks?.[key] ?? false;
    definitionForm.socialLinks[linkKey as SocialLinkKey] =
      socialLinks?.[linkKey as SocialLinkKey] ?? '';
  });
};

const resetForm = () => {
  definitionForm.name = '';
  definitionForm.paymentLink = '';
  Object.assign(definitionForm.socialLinks, getDefaultSocialLinks());
  selectedDefinition.value = null;
  selectedDefinitionId.value = null;
};

const handleDefinitionSelect = async (value: number | null) => {
  if (value === null) {
    resetForm();
    return;
  }
  await loadFullDefinition(value);
};

const handleCreateNew = () => {
  resetForm();
  selectedDefinitionId.value = null;
};

const handleSubmit = async () => {
  if (!formValid.value) return;

  isSubmitting.value = true;
  try {
    const payload = {
      name: definitionForm.name.trim(),
      paymentLink: definitionForm.paymentLink.trim(),
      socialLinks: definitionForm.socialLinks,
    };

    if (selectedDefinitionId.value) {
      // Update existing
      await updateDefinition({ id: selectedDefinitionId.value, ...payload });
      snackbarError.value = false;
      snackbarText.value = 'Tanım başarıyla güncellendi.';
      snackbar.value = true;
      // Reload the definition to get updated data
      await loadFullDefinition(selectedDefinitionId.value);
      // Reload summaries to update the list
      await loadDefinitionSummaries();
    } else {
      // Create new
      const response = await createDefinition(payload);
      snackbarError.value = false;
      snackbarText.value = response.message || 'Tanım başarıyla oluşturuldu.';
      snackbar.value = true;
      // Reload summaries and select the new definition
      await loadDefinitionSummaries();
      if (response.definition && Array.isArray(response.definition) && response.definition[0]?.id) {
        await loadFullDefinition(response.definition[0].id);
      }
    }
  } catch (error) {
    console.error(error);
    snackbarError.value = true;
    snackbarText.value =
      error instanceof TRPCClientError ? error.message : 'Beklenmeyen bir hata oluştu.';
    snackbar.value = true;
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async () => {
  if (!selectedDefinitionId.value) return;

  isSubmitting.value = true;
  try {
    await deleteDefinition({ id: selectedDefinitionId.value });
    snackbarError.value = false;
    snackbarText.value = 'Tanım başarıyla silindi.';
    snackbar.value = true;
    resetForm();
    await loadDefinitionSummaries();
  } catch (error) {
    console.error(error);
    snackbarError.value = true;
    snackbarText.value =
      error instanceof TRPCClientError ? error.message : 'Tanım silinirken bir hata oluştu.';
    snackbar.value = true;
  } finally {
    isSubmitting.value = false;
    showDeleteDialog.value = false;
  }
};

onMounted(async () => {
  await loadDefinitionSummaries();
});
</script>

<template>
  <div>
    <v-toolbar flat rounded="lg" class="mb-4 border">
      <v-toolbar-title>
        <v-icon color="medium-emphasis" icon="mdi-cog" size="x-small" start />
        Tanımlar
      </v-toolbar-title>

      <v-spacer />

      <v-btn
        rounded="lg"
        class="me-3"
        border
        prepend-icon="mdi-plus"
        @click="handleCreateNew"
        :disabled="isSubmitting"
      >
        Yeni Tanım
      </v-btn>
      <GixRefreshButton :refresh-fn="loadDefinitionSummaries" />
    </v-toolbar>

    <v-card rounded="lg" class="border">
      <v-card-text>
        <v-autocomplete
          v-model="selectedDefinitionId"
          :items="autocompleteItems"
          item-title="title"
          item-value="value"
          label="Tanım Seç"
          variant="outlined"
          rounded="lg"
          prepend-inner-icon="mdi-magnify"
          clearable
          :loading="isLoadingDefinition"
          @update:model-value="handleDefinitionSelect"
          class="mb-4"
        >
          <template #no-data>
            <div class="text-center pa-4">
              <v-icon icon="mdi-information" class="mb-2" />
              <div>Tanım bulunamadı</div>
            </div>
          </template>
        </v-autocomplete>

        <v-form @submit.prevent="handleSubmit">
          <v-text-field
            label="Tanım Adı"
            v-model="definitionForm.name"
            :rules="[noEmptyRule]"
            variant="outlined"
            rounded="lg"
            class="mb-3"
            :disabled="isSubmitting"
          />

          <v-text-field
            label="Ödeme Linki"
            v-model="definitionForm.paymentLink"
            variant="outlined"
            rounded="lg"
            prepend-inner-icon="mdi-link-variant"
            class="mb-4"
            :disabled="isSubmitting"
          />

          <v-card variant="tonal" class="mb-4" rounded="lg">
            <v-card-title class="text-subtitle-1">Sosyal Bağlantılar</v-card-title>
            <v-card-text>
              <div v-for="platform in socialPlatforms" :key="platform.key" class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-switch
                    v-model="definitionForm.socialLinks[platform.key]"
                    :label="platform.label"
                    color="secondary"
                    hide-details
                    inset
                    :disabled="isSubmitting"
                  />
                </div>
                <v-text-field
                  :label="`${platform.label} Linki`"
                  v-model="definitionForm.socialLinks[platform.linkKey]"
                  :disabled="!definitionForm.socialLinks[platform.key] || isSubmitting"
                  variant="outlined"
                  rounded="lg"
                  autocomplete="off"
                  :prepend-inner-icon="platform.icon"
                  :rules="socialLinkRules(platform.key)"
                />
              </div>
            </v-card-text>
          </v-card>

          <div class="d-flex justify-end ga-2">
            <v-btn
              v-if="selectedDefinitionId"
              color="error"
              variant="outlined"
              rounded="lg"
              prepend-icon="mdi-trash-can"
              @click="showDeleteDialog = true"
              :disabled="isSubmitting"
            >
              Sil
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              rounded="lg"
              prepend-icon="mdi-content-save"
              :loading="isSubmitting"
              :disabled="!formValid"
            >
              {{ selectedDefinitionId ? 'Güncelle' : 'Oluştur' }}
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>

  <v-dialog max-width="400" v-model="showDeleteDialog" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center">
        <v-icon size="small" icon="mdi-trash-can" class="me-2" />
        Tanımı Sil
      </v-card-title>
      <v-card-text>
        Silinen tanımlar geri alınamaz, devam etmek istediğinize emin misiniz?
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text="İptal"
          rounded="lg"
          @click="showDeleteDialog = false"
          :disabled="isSubmitting"
        />
        <v-btn
          color="error"
          rounded="lg"
          prepend-icon="mdi-trash-can"
          :loading="isSubmitting"
          @click="handleDelete"
        >
          Sil
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
