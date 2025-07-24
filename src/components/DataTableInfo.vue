<script setup lang="ts"></script>

<template>
  <v-dialog max-width="600">
    <template #activator="{ props }">
      <v-btn
        style="opacity: 60%"
        variant="text"
        size="small"
        icon="mdi-information-outline"
        aria-label="Veri tablosu bilgi menüsünü aç"
        v-bind="{ ...$attrs, ...props }"
      />
    </template>
    <template #default="{ isActive }">
      <v-card prepend-icon="mdi-information" title="Veriler Hakkında">
        <v-card-text>
          <v-expansion-panels>
            <v-expansion-panel title="Hangi veriler önbellekleniyor?">
              <v-expansion-panel-text>
                Site üzerindeki DİA API'si tarafından çekilen verilerin dışındaki her veri
                önbelleklenmektedir.
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Önbelleklenen veri ne kadar süre boyunca hayatta kalır?">
              <v-expansion-panel-text>
                Önbelleklenen veri 45 saniye boyunca hayatta kalır.
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel
              title="Başka bir kullanıcı önbellekleme işlemini tetiklerse ne olur?"
            >
              <v-expansion-panel-text>
                Başka bir kullanıcı önbellekleme işlemini tetiklerse, siteyi kullanan herkes süre
                bitene kadar önbelleklenen veriden çeker.
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <template #actions>
          <v-btn text="Ok" variant="text" @click="isActive.value = false" />
        </template>
      </v-card>
    </template>
  </v-dialog>
</template>
