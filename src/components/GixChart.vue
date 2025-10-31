<script setup lang="ts">
import { PieChart } from 'echarts/charts';
import { LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { CallbackDataParams, ECBasicOption } from 'echarts/types/dist/shared';
import { provide, ref, useTemplateRef, watch } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';

import { formatCurrency } from '@/utils/formatting';

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent]);
provide(THEME_KEY, 'dark');

const props = defineProps<{
  loading?: boolean;
  title?: string;
  currency?: string;
  legendData: string[];
  seriesName: string;
  seriesData: { value: number; name: string }[];
  height?: string;
}>();

const chartRef = useTemplateRef('chart-ref');

const option = ref<ECBasicOption>({
  backgroundColor: 'transparent',
  title: {
    text: props.title ?? '',
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
    formatter: (params: CallbackDataParams) => {
      const formattedValue = formatCurrency(typeof params.value === 'number' ? params.value : 0);
      return `${params.seriesName} <br/>${params.name} : ${formattedValue} ${props.currency ?? ''} (${params.percent}%)`;
    },
  },
  legend: {
    orient: 'horizontal',
    left: 'left',
    data: props.legendData,
  },
  series: [
    {
      name: props.seriesName,
      type: 'pie',
      radius: '55%',
      center: ['50%', '60%'],
      data: props.seriesData,
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

watch(
  () => props.seriesData,
  (newSeriesData) => {
    chartRef.value?.setOption({ ...option.value, series: { data: newSeriesData } });
  },
);
</script>

<template>
  <v-chart
    ref="chart-ref"
    :style="{ height: props.height ?? '70vh' }"
    :loading="loading"
    class="chart"
    :option="option"
  />
</template>

<style scoped>
canvas {
  padding: 30px !important;
}
</style>
