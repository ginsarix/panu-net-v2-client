<script setup lang="ts">
import { motion } from 'motion-v';
import { ref } from 'vue';
import { VIconBtn } from 'vuetify/labs/VIconBtn';

import type { MaybePromise } from '@/types/maybe-promise';

const props = defineProps<{
  refreshFn?: (...args: unknown[]) => MaybePromise<unknown>;
}>();

const refreshRotation = ref(0);
const refreshing = ref(false);

const toggleRefresh = async () => {
  if (refreshing.value) return;
  refreshing.value = true;

  refreshRotation.value += 360;

  if (props.refreshFn) await props.refreshFn();
  refreshing.value = false;
};
</script>

<template>
  <v-icon-btn @click="toggleRefresh" variant="text" class="me-1">
    <motion.div
      :animate="{ rotate: refreshRotation }"
      :transition="{ type: 'spring', stiffness: 200, damping: 20 }"
    >
      <v-icon icon="mdi-refresh" />
    </motion.div>
  </v-icon-btn>
</template>
