<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  type ChartData,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type TooltipItem,
} from 'chart.js';
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { useTheme } from 'vuetify';

import { formatToLocale } from '@/utils/formatting';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const props = defineProps<{
  loading?: boolean;
  title?: string;
  currency?: string;
  axisData: string[];
  barSeriesData: number[];
  height?: string;
  indexAxis?: 'x' | 'y';
}>();

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

const textColor = computed(() =>
  isDark.value ? 'rgba(255, 255, 255, 0.87)' : 'rgba(27, 33, 25, 0.87)',
);
const gridColor = computed(() =>
  isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
);
const tooltipBg = computed(() =>
  isDark.value ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
);
const tooltipBorder = computed(() =>
  isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
);

const chartData = computed(
  () =>
    ({
      labels: props.axisData,
      datasets: [
        {
          label: props.title ?? 'Data',
          data: props.barSeriesData,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    }) satisfies ChartData<'bar'>,
);

const chartOptions = computed(() => {
  const indexAxis = props.indexAxis ?? 'y';
  const isHorizontal = indexAxis === 'y';

  return {
    indexAxis: indexAxis as 'x' | 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!props.title,
        text: props.title ?? '',
        color: textColor.value,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: tooltipBg.value,
        titleColor: textColor.value,
        bodyColor: textColor.value,
        borderColor: tooltipBorder.value,
        borderWidth: 1,
        callbacks: {
          label: (tooltipItem: TooltipItem<'bar'>) => {
            const value =
              indexAxis === 'x' ? (tooltipItem.parsed.y ?? 0) : (tooltipItem.parsed.x ?? 0);
            const formattedValue = formatToLocale(value);
            return `${tooltipItem.label}: ${formattedValue} ${props.currency ?? ''}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: isHorizontal,
        ticks: {
          color: textColor.value,
          ...(isHorizontal
            ? {
                callback: (value: string | number) => {
                  if (typeof value === 'number') {
                    return formatToLocale(value);
                  }
                  return value;
                },
              }
            : {}),
        },
        grid: {
          color: gridColor.value,
        },
      },
      y: {
        beginAtZero: !isHorizontal,
        ticks: {
          color: textColor.value,
          ...(isHorizontal
            ? {}
            : {
                callback: (value: string | number) => {
                  if (typeof value === 'number') {
                    return formatToLocale(value);
                  }
                  return value;
                },
              }),
        },
        grid: {
          color: gridColor.value,
        },
      },
    },
    animation: {
      duration: 750,
    },
  } satisfies ChartOptions<'bar'>;
});
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
