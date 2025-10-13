import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useDisplay } from 'vuetify';

export const useDisplayStore = defineStore('display', () => {
  const display = useDisplay();
  const mobile = computed(() => display.smAndDown);
  const xs = computed(() => display.xs);

  return { display, mobile, xs };
});
