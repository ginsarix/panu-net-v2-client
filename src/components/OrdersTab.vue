<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import GixTogglerMenu from '@/components/GixTogglerMenu.vue';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { getUsersInSelectedCompany } from '@/services/api/companies';
import { forwardsOrdersToUsers } from '@/services/api/orders';
import { useCompaniesStore } from '@/stores/companies';
import { useDisplayStore } from '@/stores/display.ts';
import { useOrdersStore } from '@/stores/orders';
import { useSnackbarStore } from '@/stores/snackbar';
import type { DataTableHeaders } from '@/types/data-table-headers';
import { uniqueBy } from '@/utils/array';
import { formatDateTime, formatToLocale } from '@/utils/formatting';

import ExportAsExcel from './ExportAsExcel.vue';
import GixUserSelector from './GixUserSelector.vue';

const { mobile } = storeToRefs(useDisplayStore());

const ordersStore = useOrdersStore();
const { orders } = storeToRefs(ordersStore);

const orderUniques = computed(() => uniqueBy(orders.value, 'fisno'));

const itemsByFisno = computed(() => {
  const map = new Map<string, typeof orders.value>();
  for (const item of orders.value) {
    const group = map.get(item.fisno);
    if (group) group.push(item);
    else map.set(item.fisno, [item]);
  }
  return map;
});

const snackbarStore = useSnackbarStore();
const { snackbar, snackbarError, snackbarText } = storeToRefs(snackbarStore);

const loading = ref(false);

const loadOrders = async () => {
  loading.value = true;
  try {
    await ordersStore.loadOrders();
  } catch (error) {
    console.error(error);
    if (error instanceof TRPCClientError) {
      snackbarError.value = true;
      snackbarText.value = error.message;
      snackbar.value = true;
    }
  } finally {
    loading.value = false;
  }
};

useCompanyPeriodWatcher(loadOrders, true);

const dataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Fiş No', key: 'fisno', toggled: true, sortable: true },
  { title: 'Ünvan', key: 'unvan', toggled: true, sortable: true },
  { title: 'Toplam Tutar', key: 'toplamtutar', toggled: true, sortable: true },
  { title: 'Onay', key: 'onay', toggled: true, sortable: true },
  { title: 'Not', key: 'note', toggled: true, sortable: true },
  { title: 'Tamamı Sevk Edildi', key: 'tamamisevkedildi', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const includedDataTableHeaders = computed(() =>
  dataTableHeaders.value.filter((header) => header.toggled),
);

const itemsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Türü', key: 'turuack', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'kartaciklama', toggled: true, sortable: true },
  { title: 'Miktar', key: 'miktar', toggled: true, sortable: true },

  { title: 'Tutar', key: 'tutari', toggled: true, sortable: true },
  { title: 'Birim Fiyatı Dövizi', key: 'birimfiyatidovizi', toggled: true, sortable: true },
  { title: 'Birim', key: 'anabirimi', toggled: true, sortable: true },
]);

useColumnVisibility('orders', dataTableHeaders);

const forwardingDialog = ref(false);

const usersInSelectedCompany =
  ref<Awaited<ReturnType<typeof getUsersInSelectedCompany>>['users']>();

const companiesStore = useCompaniesStore();
const { selectedCompanyId } = storeToRefs(companiesStore);

watch(selectedCompanyId, () => {
  usersInSelectedCompany.value = [];
});

const updateUsersInSelectedCompany = async () => {
  try {
    const response = await getUsersInSelectedCompany();
    usersInSelectedCompany.value = response.users;
  } catch (err) {
    console.error('Failed to update users in selected company:', err);
  }
};

const openForwardingDialog = async () => {
  if (!usersInSelectedCompany.value?.length) updateUsersInSelectedCompany(); // intentionally fire-and-forget so that dialog doesnt wait for the users to load before opening

  forwardingDialog.value = true;
};

type ForwardingOptionsValues = 'dispatched' | 'undispatched' | null;

const forwardingOptions = ref<{ title: string; value: ForwardingOptionsValues }[]>([
  { title: 'Hepsi', value: null },
  { title: 'Sevk Edilenler', value: 'dispatched' },
  { title: 'Sevk Edilmeyenler', value: 'undispatched' },
]);

const selectedForwardingOption = ref<ForwardingOptionsValues>(null);

const forwardingFilteredOrders = computed(() => {
  if (selectedForwardingOption.value === null) return orderUniques.value;

  const apiDispatchValues = { dispatched: 't', undispatched: 'f' } as const;
  const apiDispatchValue = apiDispatchValues[selectedForwardingOption.value];

  return orderUniques.value.filter((o) => o.tamamisevkedildi === apiDispatchValue);
});

const selectedOrderFisNosToForward = ref<string[]>(
  forwardingFilteredOrders.value.map((o) => o.fisno),
);

const selectedUsersToForward = ref<number[]>([]);

const forwarding = ref(false);

const forwardOrders = async () => {
  const orderItems = selectedOrderFisNosToForward.value.flatMap(
    (fisno) => itemsByFisno.value.get(fisno) ?? [],
  );

  const formattedOrderItems = orderItems.map((o) => ({
    ...o,
    tutari: formatToLocale(o.tutari),
    toplamtutar: formatToLocale(o.toplamtutar),
    miktar: formatToLocale(o.miktar),
    _cdate: formatDateTime(o._cdate),
  }));

  forwarding.value = true;
  try {
    await forwardsOrdersToUsers({
      orders: formattedOrderItems,
      userIds: selectedUsersToForward.value,
    });
    forwardingDialog.value = false;
    snackbarText.value = 'Siparişler başarıyla iletildi.';
    snackbar.value = true;
  } catch (error) {
    if (error instanceof TRPCClientError) {
      snackbarError.value = true;
      snackbarText.value = error.message;
      snackbar.value = true;
    }
  } finally {
    forwarding.value = false;
  }
};
</script>

<template>
  <v-data-table
    :items="orderUniques"
    :loading
    class="rounded-lg elevation-0 border"
    no-data-text="Sipariş bulunamadı."
    loading-text="Siparişler yükleniyor..."
    items-per-page-text="Sayfa başı sipariş"
    :mobile="mobile.value"
    fixed-header
    :headers="includedDataTableHeaders"
    hover
    show-expand
    item-value="fisno"
  >
    <template #top>
      <v-toolbar flat rounded class="rounded-b-0">
        <v-toolbar-title>
          <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
          Siparişler
        </v-toolbar-title>

        <v-btn
          @click="openForwardingDialog"
          prepend-icon="mdi-share"
          rounded="lg"
          class="border me-3"
          >Personellere İlet</v-btn
        >

        <GixTogglerMenu
          menu-activator-btn-text="Kolonlar"
          menu-activator-btn-class="rounded-lg border me-3"
          menu-activator-btn-icon="mdi-filter-variant"
          v-model:toggle-items="dataTableHeaders"
        />

        <ExportAsExcel
          class="me-5"
          :disabled="loading"
          :items="orders"
          filename="siparisler"
          :headers="[includedDataTableHeaders.map((header) => header.title)]"
        />
      </v-toolbar>
    </template>
    <template #[`item.toplamtutar`]="{ item: { fisno } }">
      {{
        formatToLocale(itemsByFisno.get(fisno)?.reduce((sum, w) => sum + Number(w.tutari), 0) ?? 0)
      }}
    </template>

    <template #[`item.tamamisevkedildi`]="{ item: { tamamisevkedildi } }">
      {{ tamamisevkedildi === 't' ? 'Evet' : 'Hayır' }}
    </template>
    <template #[`item._cdate`]="{ item: { _cdate } }">
      {{ formatDateTime(_cdate) }}
    </template>

    <template #[`item.data-table-expand`]="{ internalItem, isExpanded, toggleExpand }">
      <v-btn
        :append-icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        text="Kalemler"
        rounded="lg"
        class="text-none"
        color="medium-emphasis"
        size="small"
        variant="text"
        width="105"
        border
        slim
        @click="toggleExpand(internalItem)"
      />
    </template>

    <template #expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length" class="py-2">
          <v-sheet rounded="lg" border>
            <v-data-table
              :mobile="mobile.value"
              :headers="itemsDataTableHeaders"
              :items="itemsByFisno.get(item.fisno)"
              hide-default-footer
            >
              <template #[`item.miktar`]>
                {{ formatToLocale(item.miktar) }}
              </template>
              <template #[`item.tutari`]="{ item }">
                {{ formatToLocale(item.tutari) }}
              </template>
            </v-data-table>
          </v-sheet>
        </td>
      </tr>
    </template>
  </v-data-table>

  <v-dialog v-model="forwardingDialog" max-width="1000">
    <v-card
      rounded="lg"
      title="Personellere Sipariş İlet"
      subtitle="Firmanızdaki personellere e-posta aracılığıyla sipariş seçip iletin"
      tag="form"
      @submit.prevent="forwardOrders"
    >
      <v-card-text>
        <v-stepper
          :items="['Sipariş Seçimi', 'Personel Seçimi']"
          editable
          :mobile="mobile.value"
          rounded="lg"
          prev-text="Önceki"
          next-text="Sonraki"
        >
          <template #[`item.1`]>
            <v-select
              label="Sevk Filtresi"
              v-model="selectedForwardingOption"
              variant="outlined"
              :items="forwardingOptions"
              rounded="lg"
              class="mt-1"
            />

            <v-data-table
              no-data-text="Sipariş bulunamadı."
              loading-text="Siparişler yükleniyor..."
              items-per-page-text="Sayfa başı sipariş"
              class="border rounded-lg"
              v-model="selectedOrderFisNosToForward"
              item-value="fisno"
              show-select
              hover
              select-strategy="all"
              :items="forwardingFilteredOrders"
              :headers="dataTableHeaders"
            >
              <template #[`item.toplamtutar`]="{ item: { fisno } }">
                {{
                  formatToLocale(
                    itemsByFisno.get(fisno)?.reduce((sum, w) => sum + Number(w.tutari), 0) ?? 0,
                  )
                }}
              </template>
              <template #[`item.tamamisevkedildi`]="{ item: { tamamisevkedildi } }">
                {{ tamamisevkedildi === 't' ? 'Evet' : 'Hayır' }}
              </template>
              <template #[`item._cdate`]="{ item: { _cdate } }">
                {{ formatDateTime(_cdate) }}
              </template>
            </v-data-table>
          </template>

          <template #[`item.2`]>
            <GixUserSelector
              :users="usersInSelectedCompany"
              v-model="selectedUsersToForward"
              empty-text="Personel bulunamadı."
            />
          </template>
        </v-stepper>
      </v-card-text>
      <v-card-actions>
        <v-btn rounded="lg" @click="forwardingDialog = false">İptal</v-btn>
        <v-btn
          type="submit"
          color="primary"
          rounded="lg"
          :loading="forwarding"
          :disabled="!selectedOrderFisNosToForward.length || !selectedUsersToForward.length"
          >İlet</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
