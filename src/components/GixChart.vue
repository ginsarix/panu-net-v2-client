<script setup lang="ts">
import { PieChart } from 'echarts/charts';
import { LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECBasicOption } from 'echarts/types/dist/shared';
import { provide, ref } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';

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

const option = ref<ECBasicOption>({
  backgroundColor: 'transparent',
  title: {
    text: props.title ?? '',
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
    formatter: `{a} <br/>{b} : {c}${props.currency ?? ''} ({d}%)`,
  },
  legend: {
    orient: 'vertical',
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

const chartRef = ref<typeof VChart>();

defineExpose({ ...chartRef.value });
</script>

<template>
  <v-chart
    ref="chartRef"
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
