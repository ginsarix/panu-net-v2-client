<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  cached: boolean;
}>();

const icon = computed(() => (props.cached ? 'mdi-sync-alert' : 'mdi-sync'));
const color = computed(() => (props.cached ? 'orange-lighten-3' : 'blue-lighten-3'));

const cachedText = 'Önbellekteki verileri görüyorsunuz, veriler eski olabilir!';
const notCachedText = 'Veriler Taze!';
const text = computed(() => (props.cached ? cachedText : notCachedText));
</script>

<template>
  <v-tooltip :text="text">
    <template #activator="{ props }">
      <v-icon v-bind="{ ...$attrs, ...props }" :color="color" :icon="icon" />
    </template>
  </v-tooltip>
</template>
