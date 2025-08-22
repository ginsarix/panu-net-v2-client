<script setup lang="ts">
import { PieChart } from 'echarts/charts';
import { LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECBasicOption } from 'echarts/types/dist/shared';
import { storeToRefs } from 'pinia';
import { computed, provide, ref } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';

import { useCreditorsStore } from '@/stores/creditors.ts';
import { useDebtorsStore } from '@/stores/debtors.ts';

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent]);
provide(THEME_KEY, 'dark');

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

const option = ref<ECBasicOption>({
  backgroundColor: 'transparent',
  title: {
    text: 'B/A Analiz Grafiği',
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c}TL ({d}%)',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    data: ['Borçlu', 'Alacaklı'],
  },
  series: [
    {
      name: 'B/A',
      type: 'pie',
      radius: '55%',
      center: ['50%', '60%'],
      data: [
        { value: totalDebtorBalance, name: 'Borçlu' },
        { value: totalCreditorBalance, name: 'Alacaklı' },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
});
</script>

<template>
  <v-chart :loading="loading" class="chart" :option="option" />
</template>

<style scoped>
.chart {
  height: 70vh;
}

canvas {
  padding: 30px !important;
}
</style>
