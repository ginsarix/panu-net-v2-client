<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useCurrentUserStore } from '@/stores/current-user';
import { useDefinitionsStore } from '@/stores/definitions';

const currentUserStore = useCurrentUserStore();
const { currentUser } = storeToRefs(currentUserStore);

const definitionsStore = useDefinitionsStore();
const { currentDefinition, loadingCurrentDefinition } = storeToRefs(definitionsStore);

const socials = computed(() => [
  {
    enabled: currentDefinition.value?.socialLinks?.facebook,
    icon: 'mdi-facebook',
    href: currentDefinition.value?.socialLinks?.facebookLink || '',
    ariaLabel: 'Facebook',
    color: '#0866ff',
  },
  {
    enabled: currentDefinition.value?.socialLinks?.twitter,
    icon: 'mdi-twitter',
    href: currentDefinition.value?.socialLinks?.twitterLink || '',
    ariaLabel: 'Twitter',
    color: '#1da1f2',
  },
  {
    enabled: currentDefinition.value?.socialLinks?.linkedin,
    icon: 'mdi-linkedin',
    href: currentDefinition.value?.socialLinks?.linkedinLink || '',
    ariaLabel: 'LinkedIn',
    color: '#4267b2',
  },
  {
    enabled: currentDefinition.value?.socialLinks?.instagram,
    icon: 'mdi-instagram',
    href: currentDefinition.value?.socialLinks?.instagramLink || '',
    ariaLabel: 'Instagram',
    class: 'instagram',
  },
  {
    enabled: currentDefinition.value?.socialLinks?.youtube,
    icon: 'mdi-youtube',
    href: currentDefinition.value?.socialLinks?.youtubeLink || '',
    ariaLabel: 'Youtube',
    color: '#cd201f',
  },
]);
</script>

<template>
  <v-footer class="text-center d-flex flex-column ga-2 py-4">
    <div class="d-flex ga-3">
      <template v-if="!loadingCurrentDefinition">
        <v-btn
          v-for="social in socials.filter((social) => social.enabled)"
          :key="social.icon"
          :icon="social.icon"
          :href="social.href"
          :aria-label="social.ariaLabel"
          :color="social.color"
          :class="social.class"
          target="_blank"
          density="comfortable"
          variant="text"
        />
      </template>
      <template v-else>
        <v-skeleton-loader type="button" width="32" height="32" />
        <v-skeleton-loader type="button" width="32" height="32" />
        <v-skeleton-loader type="button" width="32" height="32" />
        <v-skeleton-loader type="button" width="32" height="32" />
        <v-skeleton-loader type="button" width="32" height="32" />
      </template>
    </div>

    <v-divider thickness="2" width="50" />

    <div v-if="currentUser">
      <span class="text-subtitle-2 text-medium-emphasis">
        Özel Raporlama Yazılımı Web Servis aracılığıyla çalışmakta olup, 80 sorgu 1 kontüre tekamül
        etmektedir.
      </span>
    </div>

    <v-divider />

    <div>
      &copy; {{ new Date().getFullYear() }} —
      <strong style="letter-spacing: 0.1em" class="panu-font">Panu</strong> &trade;
    </div>
  </v-footer>
</template>

<style scoped>
.instagram {
  background: radial-gradient(
    circle at 30% 110%,
    #ffdb8b 0%,
    #ee653d 25%,
    #d42e81 50%,
    #a237b6 75%,
    #3e57bc 100%
  );
  color: #dde5d8;
}
</style>
