<script setup lang="ts">
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip, type TooltipItem } from 'chart.js';
import { computed } from 'vue';
import { Pie } from 'vue-chartjs';

import { formatCurrency } from '@/utils/formatting';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const props = defineProps<{
  loading?: boolean;
  title?: string;
  seriesName: string;
  seriesData: { value: number; name: string }[];
  height?: string;
  currency?: string;
}>();

const chartData = computed(() => ({
  labels: props.seriesData.map((item) => item.name),
  datasets: [
    {
      label: props.seriesName,
      data: props.seriesData.map((item) => item.value),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)',
        'rgba(255, 99, 255, 0.8)',
        'rgba(99, 255, 255, 0.8)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)',
        'rgba(255, 99, 255, 1)',
        'rgba(99, 255, 255, 1)',
      ],
      borderWidth: 2,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'rgba(255, 255, 255, 0.87)',
        font: {
          size: 12,
        },
        padding: 15,
      },
    },
    title: {
      display: !!props.title,
      text: props.title ?? '',
      color: 'rgba(255, 255, 255, 0.87)',
      font: {
        size: 16,
        weight: 'bold' as const,
      },
      position: 'top' as const,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'rgba(255, 255, 255, 0.87)',
      bodyColor: 'rgba(255, 255, 255, 0.87)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      callbacks: {
        label: (tooltipItem: TooltipItem<'pie'>) => {
          const value = tooltipItem.parsed ?? 0;
          const dataset = tooltipItem.dataset;
          const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
          const formattedValue = formatCurrency(value);
          const label = dataset.label ?? props.seriesName;
          return `${label} - ${tooltipItem.label}: ${formattedValue} ${props.currency ?? ''} (${percentage}%)`;
        },
      },
    },
  },
}));
</script>

<template>
  <div class="chart-container" :style="{ height: props.height ?? '70vh' }">
    <div v-if="loading" class="d-flex align-center justify-center" :style="{ height: '100%' }">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <Pie v-else :data="chartData" :options="chartOptions" class="chart" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.chart {
  padding: 30px !important;
  width: 100% !important;
  height: 100% !important;
}
</style>
