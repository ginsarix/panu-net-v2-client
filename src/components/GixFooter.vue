<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useCurrentUserStore } from '@/stores/current-user';

const currentUserStore = useCurrentUserStore();
const { currentUser } = storeToRefs(currentUserStore);

const socials = [
  {
    icon: 'mdi-facebook',
    href: 'https://www.facebook.com/panuteknolojii/',
    ariaLabel: 'Facebook',
    color: '#0866ff',
  },
  {
    icon: 'mdi-twitter',
    href: 'https://twitter.com/panuteknoloji',
    ariaLabel: 'Twitter',
    color: '#1da1f2',
  },
  {
    icon: 'mdi-linkedin',
    href: 'https://www.linkedin.com/company/panu-teknoloji-ltd-sti/?originalSubdomain=tr',
    ariaLabel: 'LinkedIn',
    color: '#4267b2',
  },
  {
    icon: 'mdi-instagram',
    href: 'https://www.instagram.com/panuteknoloji/?hl=tr',
    ariaLabel: 'Instagram',
    class: 'instagram',
  },
  {
    icon: 'mdi-youtube',
    href: 'https://www.youtube.com/channel/UCy1M15JA5g_zMuBh_-fu5mw',
    ariaLabel: 'Youtube',
    color: '#cd201f',
  },
];
</script>

<template>
  <v-footer class="text-center d-flex flex-column ga-2 py-4">
    <div class="d-flex ga-3">
      <v-btn
        v-for="social in socials"
        :key="social.icon"
        :icon="social.icon"
        :href="social.href"
        :aria-label="social.ariaLabel"
        :color="social.color"
        :class="social.class"
        target="_blank"
        density="comfortable"
        variant="text"
      ></v-btn>
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
}
</style>
