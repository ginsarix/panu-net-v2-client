<script setup lang="ts">
import { useMotion } from '@vueuse/motion';
import { ref } from 'vue';
import { VIconBtn } from 'vuetify/labs/VIconBtn';

import type { MaybePromise } from '@/types/maybe-promise';

const props = defineProps<{
  refreshFn?: (...args: unknown[]) => MaybePromise<unknown>;
}>();

const refreshRotations = ref(1);

const refreshing = ref(false);
const refreshBtnTarget = ref<HTMLElement | null>(null);

const { apply } = useMotion(refreshBtnTarget, {
  initial: {
    rotate: 0,
  },
});

const toggleRefresh = async () => {
  if (refreshing.value) return;
  refreshing.value = true;
  await apply({
    rotate: 360 * refreshRotations.value,
    transition: {
      ease: 'easeOut',
    },
  });
  refreshRotations.value++;

  if (props.refreshFn) await props.refreshFn();
  refreshing.value = false;
};
</script>

<template>
  <v-icon-btn
    v-motion
    ref="refreshBtnTarget"
    @click="toggleRefresh"
    variant="text"
    class="me-1"
    icon="mdi-refresh"
  />
</template>
