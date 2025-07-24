<script setup lang="ts">
import { format } from 'date-fns';
import { computed, ref, watch } from 'vue';
import { VDateInput } from 'vuetify/labs/components';

import { useValidationError } from '@/composables/useValidationError.ts';
import { ActionMode } from '@/types/action-mode.ts';
import type { InputProperties } from '@/types/input-properties.ts';
import type { StepperProperties } from '@/types/stepper-properties.ts';

const emit = defineEmits<{
  (e: 'afterLeave'): void;
  (e: 'update:showDialog', value: boolean): void;
  (e: 'update:currentMode', value: ActionMode): void;
  (e: 'update:inputsProperties', value: InputProperties[]): void;
  (e: 'update:errorMessage', value: string): void;
  (e: 'submit', value: InputProperties[]): void;
}>();

const props = defineProps<{
  showDialog: boolean;
  maxDialogWidth?: number | string;
  currentMode: ActionMode;
  deleteText?: string;
  inputsProperties: InputProperties[];
  stepperProperties?: StepperProperties[];
  errorMessage: string;
}>();

const internalShowDialog = computed({
  get: () => props.showDialog,
  set: (val: boolean) => emit('update:showDialog', val),
});
const internalCurrentMode = computed({
  get: () => props.currentMode,
  set: (val: ActionMode) => emit('update:currentMode', val),
});

const errorMessage = ref(props.errorMessage);

watch(
  () => props.errorMessage,
  (val) => {
    errorMessage.value = val;
  },
);

const isSubmitting = ref(false);
const formSubmitted = ref(false);

const updateInputsPropertiesValue = (value: string | number | boolean | null, id: string) => {
  const strVal = String(value ?? '');
  const newInputsProperties = props.inputsProperties.map((input) =>
    input.id === id ? { ...input, value: strVal } : input,
  );

  emit('update:inputsProperties', newInputsProperties);
};
const updateInputsPropertiesShowPassword = (value: boolean, id: string) => {
  const newInputsProperties = props.inputsProperties.map((input) =>
    input.id === id ? { ...input, showPassword: value } : input,
  );

  emit('update:inputsProperties', newInputsProperties);
};

const formValid = computed(() =>
  props.inputsProperties.every(
    (input) =>
      !input.validationRules ||
      input.validationRules.every((rule) => rule(input.value || '') === true),
  ),
);

const handleSubmit = async () => {
  formSubmitted.value = true;

  if (internalCurrentMode.value === ActionMode.Create && !formValid.value) return;

  isSubmitting.value = true;
  emit('submit', props.inputsProperties);

  internalCurrentMode.value = ActionMode.Idle;
  isSubmitting.value = false;
};

const resetForm = () => {
  formSubmitted.value = false;
  errorMessage.value = '';

  const newInputsProperties = props.inputsProperties.map((inputProps) => {
    if (inputProps.neverResetValue) return inputProps;

    return {
      ...inputProps,
      value: '',
      showPassword: inputProps.type === 'password' ? false : inputProps.showPassword,
    };
  });

  emit('update:inputsProperties', newInputsProperties);
};

const isForm = computed(() =>
  [ActionMode.Create, ActionMode.Edit].includes(internalCurrentMode.value),
);

const cardIcon = computed(() => {
  switch (internalCurrentMode.value) {
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
  switch (internalCurrentMode.value) {
    case ActionMode.Create:
      return 'Oluştur';
    case ActionMode.Edit:
      return 'Düzenle';
    case ActionMode.Delete:
      return 'Sil';
    case ActionMode.Idle:
      return '👋';
    default:
      return internalCurrentMode.value;
  }
});

const textInputTypes = ['text', 'tel', 'email', 'password', 'url', 'search'];

const updateDateInputValue = (newDate: Date, id: string) => {
  const newInputsProperties = props.inputsProperties.map((inputProps) =>
    inputProps.id === id
      ? {
          ...inputProps,
          value: newDate.toISOString(),
        }
      : inputProps,
  );

  emit('update:inputsProperties', newInputsProperties);
};

const defaultStepperProperties = computed(() => [
  {
    step: 1,
    inputIds: props.inputsProperties.map((p) => p.id),
    title: 'Alanlar',
  },
]);

const getRules = (inputProperties: InputProperties) =>
  props.currentMode === ActionMode.Create ? inputProperties.validationRules || [] : [];
</script>

<template>
  <v-dialog
    v-model="internalShowDialog"
    @afterLeave="
      resetForm();
      $emit('afterLeave');
    "
    :max-width="`${maxDialogWidth ?? '400'}px`"
    aria-labelledby="crud-dialog-title"
  >
    <v-card rounded="lg">
      <v-card-title id="crud-dialog-title">
        <v-icon size="small" :icon="cardIcon" />
        {{ cardTitle }}
      </v-card-title>
      <v-form class="pa-2" @submit.prevent="handleSubmit">
        <v-card-text>
          <v-alert v-if="errorMessage" type="error" class="mb-4" closable>
            {{ errorMessage }}
          </v-alert>
          <div v-if="isForm">
            <v-stepper
              editable
              :items="stepperProperties?.map((p) => p.title) ?? defaultStepperProperties"
              :hide-actions="!stepperProperties"
              rounded="lg"
              prev-text="Önceki"
              next-text="Sonraki"
            >
              <template
                v-for="property in stepperProperties ?? defaultStepperProperties"
                :key="property.title"
                #[`item.${property.step}`]
              >
                <div
                  v-for="inputProperties in inputsProperties.filter((p) =>
                    property.inputIds.includes(p.id),
                  )"
                  :key="inputProperties.id"
                  class="mt-1"
                >
                  <v-autocomplete
                    v-if="inputProperties.type === 'select'"
                    :label="inputProperties.label"
                    :items="inputProperties.selectItems"
                    no-data-text="Veri bulunamadı"
                    @update:model-value="
                      (value) => updateInputsPropertiesValue(value, inputProperties.id)
                    "
                  />
                  <v-radio-group
                    v-if="inputProperties.type === 'radio'"
                    @update:model-value="
                      (value) => updateInputsPropertiesValue(value as string, inputProperties.id)
                    "
                  >
                    <v-radio
                      v-for="radio in inputProperties.radios"
                      :label="radio.label"
                      :value="radio.value"
                      :key="radio.id"
                    />
                  </v-radio-group>

                  <v-date-input
                    v-if="inputProperties.type === 'date'"
                    :display-format="(date: Date) => format(date, 'dd.MM.yyyy')"
                    :label="inputProperties.label"
                    placeholder="gg.aa.yyyy"
                    variant="outlined"
                    rounded="lg"
                    :rules="getRules(inputProperties)"
                    @update:model-value="
                      (newDate) => updateDateInputValue(new Date(newDate), inputProperties.id)
                    "
                  />

                  <v-checkbox
                    v-if="inputProperties.type === 'checkbox'"
                    :label="inputProperties.label"
                    :model-value="inputProperties.value === 'true'"
                    @update:model-value="
                      (value) => updateInputsPropertiesValue(value, inputProperties.id)
                    "
                  />

                  <v-number-input
                    v-if="inputProperties.type === 'number'"
                    :label="inputProperties.label"
                    variant="outlined"
                    rounded="lg"
                    inset
                    :rules="getRules(inputProperties)"
                    @update:model-value="
                      (value) => updateInputsPropertiesValue(value, inputProperties.id)
                    "
                  />

                  <v-text-field
                    v-if="textInputTypes.includes(inputProperties.type)"
                    :label="inputProperties.label"
                    :type="
                      inputProperties.type === 'password'
                        ? inputProperties.showPassword
                          ? 'text'
                          : 'password'
                        : inputProperties.type
                    "
                    :value="inputProperties.value"
                    :prepend-inner-icon="inputProperties.icon"
                    :append-inner-icon="
                      inputProperties.type === 'password'
                        ? !inputProperties.showPassword
                          ? 'mdi-eye'
                          : 'mdi-eye-off'
                        : undefined
                    "
                    @click:append-inner="
                      () =>
                        updateInputsPropertiesShowPassword(
                          !(inputProperties.showPassword ?? false),
                          inputProperties.id,
                        )
                    "
                    :hint="inputProperties.hint"
                    :counter="inputProperties.counter"
                    :rules="getRules(inputProperties)"
                    :error-messages="
                      inputProperties.validationRules && currentMode === ActionMode.Create
                        ? useValidationError(
                            inputProperties.value,
                            !formSubmitted
                              ? true
                              : inputProperties.validationRules?.every(
                                  (rule) => rule(inputProperties.value) === true,
                                ),
                            inputProperties.validationRules,
                          )
                        : []
                    "
                    :class="inputProperties.validationRules ? 'mb-3' : ''"
                    variant="outlined"
                    rounded="lg"
                    @update:model-value="
                      (value) => updateInputsPropertiesValue(value, inputProperties.id)
                    "
                  />
                </div>
              </template>
            </v-stepper>
          </div>

          <div v-else-if="internalCurrentMode === ActionMode.Delete">
            <span v-if="deleteText">{{ deleteText }}</span>
            <span v-else> Silinenler geri alınamaz, devam etmek istediğinize emin misiniz? </span>
          </div>
          <div v-else>🧑‍💻</div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn @click="internalCurrentMode = ActionMode.Idle" text="İptal" rounded="lg" />
          <v-btn
            type="submit"
            :loading="isSubmitting"
            :disabled="internalCurrentMode === ActionMode.Create && !formValid"
            :text="isForm ? 'Kaydet' : 'Evet'"
            :color="isForm ? 'primary' : 'error'"
            rounded="lg"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<style>
/* so that hints and error messages are not selectable */
.v-messages {
  user-select: none !important;
}
</style>
