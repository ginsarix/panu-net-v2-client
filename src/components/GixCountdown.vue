<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';

const seconds = defineModel({ type: Number, default: 60 });

const counter = ref(seconds.value);

const displayMinutes = computed(() => Math.floor(counter.value / 60));
const displaySeconds = computed(() => counter.value % 60);

const tickInterval = setInterval(() => {
  if (counter.value <= 0) {
    clearInterval(tickInterval);
    return;
  }
  counter.value--;
}, 1000);

onUnmounted(() => clearInterval(tickInterval));
</script>

<template>
  <span v-bind="$attrs"
    >{{ displayMinutes.toString().padStart(2, '0') }}:{{
      displaySeconds.toString().padStart(2, '0')
    }}</span
  >
</template>
