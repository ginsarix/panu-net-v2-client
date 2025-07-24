<script setup lang="ts">
defineProps<{
  activator: string;
}>();
</script>

<template>
  <v-dialog :activator="activator" max-width="400">
    <template #default="{ isActive }">
      <v-card prepend-icon="mdi-information" title="Rol İkonları">
        <v-card-text>
          <v-list>
            <v-list-item class="mb-3" prepend-icon="mdi-key" rounded border>
              <v-list-item-title class="border-s">
                <span class="ms-5">Admin</span></v-list-item-title
              >
            </v-list-item>
            <v-list-item prepend-icon="mdi-account" rounded border>
              <v-list-item-title class="border-s">
                <span class="ms-5">Kullanıcı</span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <template #actions>
          <v-btn class="ms-auto" text="Ok" variant="text" @click="isActive.value = false" />
        </template>
      </v-card>
    </template>
  </v-dialog>
</template>
