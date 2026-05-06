<script setup lang="ts">
export type SelectableUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

const props = defineProps<{
  users: SelectableUser[] | undefined;
  emptyText?: string;
}>();

const selected = defineModel<number[]>({ default: [] });

const toggle = (id: number) => {
  const idx = selected.value.indexOf(id);
  if (idx === -1) selected.value = [...selected.value, id];
  else selected.value = selected.value.filter((v) => v !== id);
};
</script>

<template>
  <p v-if="!users?.length" class="text-medium-emphasis text-body-2">
    {{ emptyText ?? 'Kullanıcı bulunamadı.' }}
  </p>
  <v-row v-else>
    <v-col v-for="user in users" :key="user.id" cols="12" sm="6" md="4">
      <v-card
        rounded="lg"
        :variant="selected.includes(user.id) ? 'tonal' : 'flat'"
        :color="selected.includes(user.id) ? 'primary' : undefined"
        :class="{ border: !selected.includes(user.id) }"
        class="cursor-pointer"
        @click="toggle(user.id)"
      >
        <v-card-item>
          <template #prepend>
            <v-avatar color="primary" variant="tonal" size="38">
              {{ user.name.charAt(0).toUpperCase() }}
            </v-avatar>
          </template>
          <v-card-title class="text-body-1 font-weight-medium">{{ user.name }}</v-card-title>
          <v-card-subtitle>{{ user.role }}</v-card-subtitle>
          <template #append>
            <v-checkbox-btn
              :model-value="selected.includes(user.id)"
              @click.stop="toggle(user.id)"
            />
          </template>
        </v-card-item>
        <v-card-text class="pt-0">
          <div class="d-flex align-center ga-1 text-body-2">
            <v-icon size="small" icon="mdi-email-outline" />
            {{ user.email }}
          </div>
          <div v-if="user.phone" class="d-flex align-center ga-1 text-body-2 mt-1">
            <v-icon size="small" icon="mdi-phone-outline" />
            {{ user.phone }}
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
