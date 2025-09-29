<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';
import { ref } from 'vue';

import { setSelectedPeriod } from '@/services/api/companies';
import { useAsyncGateStore } from '@/stores/async-gate';
import { useCompaniesStore } from '@/stores/companies';
import { formatDateTime } from '@/utils/formatting';

const asyncGateStore = useAsyncGateStore();

const companiesStore = useCompaniesStore();
const { periods, selectedPeriodCode } = storeToRefs(companiesStore);

onMounted(() => {
  void companiesStore.loadSelectedPeriodCode();
});

watch(selectedPeriodCode, async (newValue) => {
  try {
    asyncGateStore.reset();

    await setSelectedPeriod(newValue);

    asyncGateStore.markReady();
  } catch (error) {
    console.error(error);
  }
});

const periodSelectorText = computed(() =>
  !selectedPeriodCode.value ? 'Dönem Seç' : `Dönem: ${selectedPeriodCode.value}`,
);

const dialog = ref(false);
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
          <v-item-group v-model="selectedPeriodCode" selected-class="bg-primary" mandatory>
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
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" rounded="lg" @click="dialog = !dialog">Tamam</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
