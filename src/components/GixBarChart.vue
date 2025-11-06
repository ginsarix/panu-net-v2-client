<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type TooltipItem,
} from 'chart.js';
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';

import { formatCurrency } from '@/utils/formatting';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const props = defineProps<{
  loading?: boolean;
  title?: string;
  currency?: string;
  xAxisData: string[];
  barSeriesData: number[];
  height?: string;
}>();

const chartData = computed(() => ({
  labels: props.xAxisData,
  datasets: [
    {
      label: props.title ?? 'Data',
      data: props.barSeriesData,
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    },
  ],
}));

const chartOptions = computed(() => ({
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
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
        label: (tooltipItem: TooltipItem<'bar'>) => {
          const value = tooltipItem.parsed.x ?? 0;
          const formattedValue = formatCurrency(value);
          return `${tooltipItem.label}: ${formattedValue} ${props.currency ?? ''}`;
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        color: 'rgba(255, 255, 255, 0.87)',
        callback: (value: string | number) => {
          if (typeof value === 'number') {
            return formatCurrency(value);
          }
          return value;
        },
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
    },
    y: {
      ticks: {
        color: 'rgba(255, 255, 255, 0.87)',
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  animation: {
    duration: 750,
  },
}));
</script>

<template>
  <div class="chart-container" :style="{ height: props.height ?? '70vh' }">
    <div v-if="loading" class="d-flex align-center justify-center" :style="{ height: '100%' }">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <Bar v-else :data="chartData" :options="chartOptions" class="bar-chart" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.bar-chart {
  padding: 30px !important;
  width: 100% !important;
  height: 100% !important;
}
</style>
