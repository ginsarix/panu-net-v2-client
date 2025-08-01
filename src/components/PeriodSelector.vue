<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { ref } from 'vue';

import { setSelectedPeriod } from '@/services/api/companies';
import { useCompaniesStore } from '@/stores/companies';

const companiesStore = useCompaniesStore();
const { periods, selectedPeriodCode } = storeToRefs(companiesStore);

watch(selectedPeriodCode, async (newValue) => {
  try {
    if (newValue === undefined) return;

    await setSelectedPeriod(newValue);
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
  <!-- <Transition> only allows 1 element  -->
  <div>
    <v-btn v-bind="$attrs" @click="dialog = true" append-icon="mdi-timeline-clock" variant="flat">{{
      periodSelectorText
    }}</v-btn>

    <v-dialog v-model="dialog" max-width="600">
      <v-card rounded="lg">
        <v-card-text>
          <v-item-group v-model="selectedPeriodCode" selected-class="bg-primary" mandatory>
            <v-container>
              <v-row>
                <v-col cols="6" v-for="period in periods" :key="period.code">
                  <v-item v-slot="{ selectedClass, toggle }" :value="period.code">
                    <v-card
                      :class="['d-flex align-center mb-3', selectedClass]"
                      height="200"
                      rounded="lg"
                      variant="outlined"
                      @click="toggle"
                    >
                      <div class="flex-grow-1 text-center">
                        <span class="text-h4"> Dönem {{ period.code }} </span>
                        <v-spacer />
                        <span> {{ period.startDate }} — {{ period.endDate }} </span>
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
