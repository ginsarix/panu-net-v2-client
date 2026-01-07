<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';

const theme = useTheme();

const isDark = computed(() => theme.current.value.dark);
const icon = computed(() => (isDark.value ? 'mdi-weather-night' : 'mdi-white-balance-sunny'));
const tooltip = computed(() => (isDark.value ? "Açık tema'ya geç" : "Koyu tema'ya geç"));

function toggleTheme() {
  const newTheme = isDark.value ? 'light' : 'dark';
  theme.change(newTheme); // its probably ok to use theme.toggle() here too
  localStorage.setItem('theme', newTheme);
}
</script>

<template>
  <v-tooltip :text="tooltip" location="bottom">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :icon="icon"
        variant="text"
        @click="toggleTheme"
        aria-label="Tema değiştir"
      />
    </template>
  </v-tooltip>
</template>
