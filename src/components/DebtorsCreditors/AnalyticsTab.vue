<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useCreditorsStore } from '@/stores/creditors.ts';
import { useDebtorsStore } from '@/stores/debtors.ts';

import GixChart from '../GixChart.vue';

defineProps<{
  loading?: boolean;
}>();

const debtorsStore = useDebtorsStore();
const creditorsStore = useCreditorsStore();

const { debtors } = storeToRefs(debtorsStore);
const { creditors } = storeToRefs(creditorsStore);

const totalDebtorBalance = computed(() =>
  debtors.value.map((d) => d.balance).reduce((a, b) => a + b, 0),
);

const totalCreditorBalance = computed(() =>
  creditors.value.map((d) => d.balance).reduce((a, b) => a + b, 0),
);
</script>

<template>
  <GixChart
    :loading="loading"
    title="B/A Analiz Grafiği"
    :legendData="['Borçlu', 'Alacaklı']"
    seriesName="B/A"
    :seriesData="[
      { value: totalDebtorBalance, name: 'Borçlu' },
      { value: totalCreditorBalance, name: 'Alacaklı' },
    ]"
    currency="TL"
  />
</template>
