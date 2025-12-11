<script setup lang="ts">
import type { ToggleItem } from '@/types/toggle-item.ts';

const props = defineProps<{
  menuActivatorBtnText: string;
  menuActivatorBtnClass?: string;
  menuActivatorBtnIcon?: string;
  toggleItems: ToggleItem[];
}>();

const emit = defineEmits<{
  (e: 'update:toggleItems', value: ToggleItem[]): void;
}>();

const toggle = (key: string) => {
  const newMenuItems = props.toggleItems.map((item) => {
    if (item.key === key) {
      return { ...item, toggled: !item.toggled };
    }
    return item;
  });

  emit('update:toggleItems', newMenuItems);
};
</script>

<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn
        v-bind="{ ...props, ...$attrs }"
        :class="menuActivatorBtnClass ?? ''"
        :prepend-icon="menuActivatorBtnIcon"
      >
        {{ menuActivatorBtnText }}
      </v-btn>
    </template>

    <v-list class="py-0 border-s border-e">
      <v-list-item
        v-for="item in toggleItems.filter((item) => item.title)"
        :key="item.key"
        :value="item.key"
        class="border-b"
        @click="toggle(item.key)"
      >
        <v-list-item-title class="d-flex justify-space-between align-center">
          <span :class="{ 'text-primary': item.toggled }">{{ item.title }}</span>
          <transition name="toggled-icon-scale">
            <v-icon
              v-show="item.toggled"
              icon="mdi-check"
              color="medium-emphasis"
              size="x-small"
              end
            />
          </transition>
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style scoped>
.toggled-icon-scale-enter-active,
.toggled-icon-scale-leave-active {
  transition: transform 0.2s ease-in-out;
}

.toggled-icon-scale-enter-from {
  transform: scale(0);
}
.toggled-icon-scale-enter-to {
  transform: scale(1);
}

.toggled-icon-scale-leave-from {
  transform: scale(1);
}
.toggled-icon-scale-leave-to {
  transform: scale(0);
}
</style>
