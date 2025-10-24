<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import { setSelectedPeriod } from '@/services/api/companies';
import { useAsyncGateStore } from '@/stores/async-gate';
import { useCompaniesStore } from '@/stores/companies';
import { formatDateTime } from '@/utils/formatting';

const asyncGateStore = useAsyncGateStore();

const companiesStore = useCompaniesStore();
const { periods, selectedPeriodCode } = storeToRefs(companiesStore);

const isInitialLoad = ref(true);
const tempSelectedPeriodCode = ref<number>();

onMounted(async () => {
  await companiesStore.loadSelectedPeriodCode();
  tempSelectedPeriodCode.value =
    selectedPeriodCode.value === 0 ? undefined : selectedPeriodCode.value;
  isInitialLoad.value = false;
});

const periodSelectorText = computed(() =>
  !selectedPeriodCode.value ? 'Dönem: Öntanımlı' : `Dönem: ${selectedPeriodCode.value}`,
);

const dialog = ref(false);

const handlePeriodConfirm = async () => {
  if (tempSelectedPeriodCode.value !== selectedPeriodCode.value) {
    try {
      asyncGateStore.reset();

      await setSelectedPeriod(tempSelectedPeriodCode.value ?? 0);
      selectedPeriodCode.value = tempSelectedPeriodCode.value ?? 0;

      asyncGateStore.markReady();
    } catch (error) {
      console.error(error);
    }
  }
  dialog.value = false;
};
</script>

<template>
  <!-- <transition> only allows 1 element  -->
  <div>
    <v-btn v-bind="$attrs" @click="dialog = true" append-icon="mdi-timeline-clock" variant="flat">{{
      periodSelectorText
    }}</v-btn>

    <v-dialog v-model="dialog" max-width="500">
      <v-card rounded="lg">
        <v-card-text>
          <v-item-group v-model="tempSelectedPeriodCode" selected-class="bg-primary">
            <v-container>
              <v-row>
                <v-col cols="12" sm="6" v-for="period in periods" :key="period.code">
                  <v-item v-slot="{ selectedClass, toggle }" :value="period.code">
                    <v-card
                      :class="['d-flex align-center mb-3', selectedClass]"
                      height="120"
                      rounded="lg"
                      variant="outlined"
                      @click="toggle"
                    >
                      <div class="flex-grow-1 text-center">
                        <span class="text-h6"> Dönem {{ period.code }} </span>
                        <v-spacer />
                        <span class="text-body-2">
                          {{ formatDateTime(period.startDate, 'dd.MM.yyyy') }}
                          —
                          {{ formatDateTime(period.endDate, 'dd.MM.yyyy') }}
                        </span>
                      </div>
                    </v-card>
                  </v-item>
                </v-col>
              </v-row>
            </v-container>
          </v-item-group>
          Öntanımlı dönemi seçmek için boş bırakınız.
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" rounded="lg" @click="handlePeriodConfirm">Tamam</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
