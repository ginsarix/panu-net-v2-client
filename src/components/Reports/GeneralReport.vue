<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { addDays, format, isBefore, isEqual } from 'date-fns';
import { AnimatePresence, motion } from 'motion-v';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { VDateInput } from 'vuetify/labs/VDateInput';
import { VIconBtn } from 'vuetify/labs/VIconBtn';

import { getGeneralReport } from '@/services/api/reports';
import { useDisplayStore } from '@/stores/display';
import type { DataTableHeaders } from '@/types/data-table-headers';
import { uniqueBy } from '@/utils/array';

import GixTogglerMenu from '../GixTogglerMenu.vue';

const { mobile, xs } = storeToRefs(useDisplayStore());

type GeneralReportReturnType = Awaited<ReturnType<typeof getGeneralReport>>;

const generalReport = ref<GeneralReportReturnType>();

const generalReportUniques = computed(() => ({
  waybills: generalReport.value
    ? uniqueBy(generalReport.value.waybills.result, 'fisno')
    : undefined,
  invoices: generalReport.value
    ? uniqueBy(generalReport.value.invoices.result, 'fisno')
    : undefined,
}));

const getWaybillItems = (fisno: string) =>
  generalReport.value?.waybills.result.filter((w) => w.fisno === fisno);
const getInvoiceItems = (fisno: string) =>
  generalReport.value?.invoices.result.filter((w) => w.fisno === fisno);

const loading = ref(false);
const error = ref('');

const requestedStartDateFilter = ref<Date>();
const requestedEndDateFilter = ref<Date>();

const startDateFilter = ref(new Date());
const endDateFilter = ref(addDays(new Date(), 1));

const dateFiltersChanged = computed(
  () =>
    requestedStartDateFilter.value !== startDateFilter.value ||
    requestedEndDateFilter.value !== endDateFilter.value,
);

const datesValid = computed(() => {
  if (!startDateFilter.value || !endDateFilter.value) return false;

  return (
    isBefore(startDateFilter.value, endDateFilter.value) ||
    isEqual(startDateFilter.value, endDateFilter.value)
  );
});

const dateErrorMessage = computed(() => {
  if (!startDateFilter.value || !endDateFilter.value) {
    return 'Lütfen başlangıç ve bitiş tarihlerini seçin';
  }
  if (!datesValid.value) {
    return 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır';
  }
  return '';
});

const loadGeneralReport = async () => {
  if (!datesValid.value) return;

  loading.value = true;
  error.value = '';

  try {
    generalReport.value = await getGeneralReport({
      startDate: startDateFilter.value,
      endDate: endDateFilter.value,
    });

    requestedStartDateFilter.value = startDateFilter.value;
    requestedEndDateFilter.value = endDateFilter.value;
  } catch (e) {
    error.value =
      e instanceof TRPCClientError || e instanceof Error
        ? e.message
        : 'Rapor yüklenirken bir hata oluştu';
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '0';
  return Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const waybillDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Fiş No', key: 'fisno', toggled: true, sortable: true },
  { title: 'İrsaliye No', key: 'belgeno2', toggled: true, sortable: true },
  { title: 'Tür', key: 'turuack', toggled: true, sortable: true },
  { title: 'Cari Ünvan', key: 'cariunvan', toggled: true, sortable: true },
  { title: 'Döviz', key: 'doviz', toggled: true, sortable: true },
  { title: 'Ara Toplam', key: 'tutari', toggled: true, sortable: true },
  { title: 'KDV', key: 'kdvtutari', toggled: true, sortable: true },
  { title: 'İndirim', key: 'indirimtutari', toggled: true, sortable: true },
  { title: 'Genel Toplam', key: 'toplamtutar', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const waybillItemsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Stok Kart Kodu', key: 'stokkartkodu', toggled: true, sortable: true },
  { title: 'Stok Açıklama', key: 'stokaciklama', toggled: true, sortable: false },
  { title: 'Miktar', key: 'miktar', toggled: true, sortable: true },
  { title: 'Birim', key: 'birim', toggled: true, sortable: true },
  { title: 'Ara Tutar', key: 'tutari', toggled: true, sortable: true },
  { title: 'KDV', key: 'kdvtutari', toggled: true, sortable: true },
  { title: 'İndirim', key: 'indirimtutari', toggled: true, sortable: true },
  { title: 'Genel Tutar', key: 'toplamtutar', toggled: true, sortable: true },
]);

const includedWaybillDataTableHeaders = computed(() =>
  waybillDataTableHeaders.value.filter((header) => header.toggled),
);

const invoiceDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Fiş No', key: 'fisno', toggled: true, sortable: true },
  { title: 'Fatura No', key: 'belgeno2', toggled: true, sortable: true },
  { title: 'Tür', key: 'turuack', toggled: true, sortable: true },
  { title: 'Cari Ünvan', key: 'unvan', toggled: true, sortable: true },
  { title: 'Döviz', key: 'kalemdovizi', toggled: true, sortable: true },
  { title: 'Ara Toplam', key: 'tutari', toggled: true, sortable: true },
  { title: 'KDV', key: 'kdvtutari', toggled: true, sortable: true },
  { title: 'İndirim', key: 'indirimtutari', toggled: true, sortable: true },
  { title: 'Genel Toplam', key: 'toplamtutar', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const invoiceItemsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Stok Kart Kodu', key: 'kartkodu', toggled: true, sortable: true },
  { title: 'Stok Açıklama', key: 'kartaciklama', toggled: true, sortable: false },
  { title: 'Miktar', key: 'miktar', toggled: true, sortable: true },
  { title: 'Birim', key: 'fatbirimi', toggled: true, sortable: true },
  { title: 'Ara Tutar', key: 'kdvharictutar', toggled: true, sortable: true },
  { title: 'KDV', key: 'kdvtutari', toggled: true, sortable: true },
  { title: 'İndirim', key: 'indirimtutari', toggled: true, sortable: true },
  { title: 'Genel Tutar', key: 'toplamtutar', toggled: true, sortable: true },
]);

const includedInvoiceDataTableHeaders = computed(() =>
  invoiceDataTableHeaders.value.filter((header) => header.toggled),
);

const bankReceiptsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Fiş No', key: 'fisno', toggled: true, sortable: true },
  { title: 'Tür', key: 'turuack', toggled: true, sortable: true },
  { title: 'Borç', key: 'borc', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'aciklama', toggled: true, sortable: false },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const includedBankReceiptsDataTableHeaders = computed(() =>
  bankReceiptsDataTableHeaders.value.filter((header) => header.toggled),
);

const creditCardCollectionsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Devir Fiş No', key: 'devirfisno', toggled: true, sortable: true },
  { title: 'Döviz Türü', key: 'dovizturu', toggled: true, sortable: true },
  { title: 'Cari Ünvan', key: 'cariunvan', toggled: true, sortable: true },
  { title: 'Banka Hesap Adı', key: 'bankahesapadi', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'aciklama', toggled: true, sortable: false },
  { title: 'Toplam Tutar', key: 'toplamtutar', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const includedCreditCardCollectionsDataTableHeaders = computed(() =>
  creditCardCollectionsDataTableHeaders.value.filter((header) => header.toggled),
);

const refreshRotation = ref(0);
const isRefreshing = ref(false);

const refresh = async () => {
  if (isRefreshing.value) return;

  isRefreshing.value = true;
  refreshRotation.value += 360;

  await loadGeneralReport();

  isRefreshing.value = false;
};
</script>

<template>
  <v-container fluid class="pa-6">
    <h2 class="text-h4 mb-6">Genel Rapor</h2>

    <v-row class="mb-2 controls-row">
      <v-col cols="12" sm="5">
        <v-date-input
          v-model="startDateFilter"
          :display-format="(date: Date) => format(date, 'dd.MM.yyyy')"
          :error-messages="!startDateFilter ? ['Zorunlu alan'] : []"
          label="Başlama tarihi"
          placeholder="gg.AA.yyyy"
          rounded="lg"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" sm="5">
        <v-date-input
          v-model="endDateFilter"
          :display-format="(date: Date) => format(date, 'dd.MM.yyyy')"
          :error-messages="dateErrorMessage ? [dateErrorMessage] : []"
          label="Bitiş tarihi"
          placeholder="gg.AA.yyyy"
          rounded="lg"
          variant="outlined"
        />
      </v-col>

      <v-col class="mt-2" cols="auto">
        <AnimatePresence>
          <motion.button
            v-if="dateFiltersChanged && generalReport && datesValid"
            key="refreshBtn"
            :initial="{ scale: 0, opacity: 0 }"
            :animate="{ scale: 1, opacity: 1, rotate: !xs.value ? refreshRotation : undefined }"
            :exit="{ scale: 0, opacity: 0 }"
            :transition="{ type: 'spring', stiffness: 200, damping: 20 }"
            @click="refresh"
          >
            <v-tooltip text="Raporu yenile" location="bottom">
              <template #activator="{ props }">
                <v-icon-btn
                  v-show="!xs.value"
                  v-bind="props"
                  icon="mdi-refresh"
                  :disabled="isRefreshing"
                />
              </template>
            </v-tooltip>
            <v-btn v-show="xs.value" class="text-none">Uygula</v-btn>
          </motion.button>
        </AnimatePresence>
      </v-col>
    </v-row>

    <v-row v-if="error">
      <v-col cols="12">
        <v-alert type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <template v-else-if="!generalReport">
      <div class="d-flex justify-center">
        <motion.button :while-hover="{ scale: 1.06 }" :while-tap="{ scale: 0.96 }">
          <v-btn
            class="text-none"
            rounded="pill"
            size="large"
            elevation="8"
            @click="loadGeneralReport"
            :loading
            :disabled="!datesValid || loading"
          >
            Raporu Getir
          </v-btn>
        </motion.button>
      </div>
    </template>
    <template v-else-if="loading">
      <v-skeleton-loader
        type="table-heading, table-thead, table-tbody, table-tfoot"
        class="rounded-lg border mb-5"
      />
      <v-skeleton-loader
        type="table-heading, table-thead, table-tbody, table-tfoot"
        class="rounded-lg border"
      />
    </template>
    <motion.div
      v-else
      :initial="{ scale: 0.9, opacity: 0 }"
      :animate="{ scale: 1, opacity: 1 }"
      :transition="{ duration: 0.25, ease: 'easeOut' }"
    >
      <v-data-table
        :items="generalReportUniques.waybills"
        class="rounded-lg elevation-0 border mb-5"
        no-data-text="İrsaliye bulunamadı."
        items-per-page-text="Sayfa başı irsaliye"
        :mobile="mobile.value"
        fixed-header
        :headers="includedWaybillDataTableHeaders"
        hover
        show-expand
        item-value="fisno"
      >
        <template #top>
          <v-toolbar flat rounded class="rounded-b-0">
            <v-toolbar-title>
              <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
              İrsaliyeler
            </v-toolbar-title>

            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border me-5"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="waybillDataTableHeaders"
            />
          </v-toolbar>
        </template>

        <template #[`item.tutari`]="{ item: { fisno } }">
          {{
            formatCurrency(
              getWaybillItems(fisno)
                ?.map((w) => Number(w.tutari))
                .reduce((acc, val) => acc + val, 0) ?? 0,
            )
          }}
        </template>
        <template #[`item.kdvtutari`]="{ item: { fisno } }">
          {{
            formatCurrency(
              getWaybillItems(fisno)
                ?.map((w) => Number(w.kdvtutari))
                .reduce((acc, val) => acc + val, 0) ?? 0,
            )
          }}
        </template>
        <template #[`item.indirimtutari`]="{ item: { fisno } }">
          {{
            formatCurrency(
              getWaybillItems(fisno)
                ?.map((w) => Number(w.indirimtutari))
                .reduce((acc, val) => acc + val, 0) ?? 0,
            )
          }}
        </template>
        <template #[`item.toplamtutar`]="{ item: { fisno } }">
          {{
            formatCurrency(
              getWaybillItems(fisno)
                ?.map((w) => Number(w.toplamtutar))
                .reduce((acc, val) => acc + val, 0) ?? 0,
            )
          }}
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
                  :headers="waybillItemsDataTableHeaders"
                  :items="getWaybillItems(item.fisno)"
                  hide-default-footer
                >
                  <template #[`item.miktar`]>
                    {{ Number(item.miktar).toFixed(2) }}
                  </template>
                  <template #[`item.tutari`]="{ item }">
                    {{ formatCurrency(item.tutari) }}
                  </template>
                  <template #[`item.kdvtutari`]="{ item }">
                    {{ formatCurrency(item.kdvtutari) }}
                  </template>
                  <template #[`item.indirimtutari`]="{ item }">
                    {{ formatCurrency(item.indirimtutari) }}
                  </template>
                  <template #[`item.toplamtutar`]="{ item }">
                    {{ formatCurrency(item.toplamtutar) }}
                  </template>
                </v-data-table>
              </v-sheet>
            </td>
          </tr>
        </template>
      </v-data-table>

      <v-data-table
        :items="generalReportUniques.invoices"
        class="rounded-lg elevation-0 border mb-16"
        no-data-text="Fatura bulunamadı."
        items-per-page-text="Sayfa başı fatura"
        :mobile="mobile.value"
        fixed-header
        :headers="includedInvoiceDataTableHeaders"
        hover
        show-expand
        item-value="fisno"
      >
        <template #top>
          <v-toolbar flat rounded class="rounded-b-0">
            <v-toolbar-title>
              <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
              Faturalar
            </v-toolbar-title>

            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border me-5"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="invoiceDataTableHeaders"
            />
          </v-toolbar>
        </template>

        <template #[`item.tutari`]="{ item: { fisno } }">
          {{
            formatCurrency(
              getInvoiceItems(fisno)
                ?.map((w) => Number(w.kdvharictutar))
                .reduce((acc, val) => acc + val, 0) ?? 0,
            )
          }}
        </template>
        <template #[`item.kdvtutari`]="{ item: { fisno } }">
          {{
            formatCurrency(
              getInvoiceItems(fisno)
                ?.map((w) => Number(w.kdvtutari))
                .reduce((acc, val) => acc + val, 0) ?? 0,
            )
          }}
        </template>
        <template #[`item.indirimtutari`]="{ item: { fisno } }">
          {{
            formatCurrency(
              getInvoiceItems(fisno)
                ?.map((w) => Number(w.indirimtutari))
                .reduce((acc, val) => acc + val, 0) ?? 0,
            )
          }}
        </template>
        <template #[`item.toplamtutar`]="{ item: { fisno } }">
          {{
            formatCurrency(
              getInvoiceItems(fisno)
                ?.map((w) => Number(w.toplamtutar))
                .reduce((acc, val) => acc + val, 0) ?? 0,
            )
          }}
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
                  :headers="invoiceItemsDataTableHeaders"
                  :items="getInvoiceItems(item.fisno)"
                  hide-default-footer
                >
                  <template #[`item.miktar`]>
                    {{ Number(item.miktar).toFixed(2) }}
                  </template>
                  <template #[`item.kdvharictutar`]="{ item }">
                    {{ formatCurrency(item.kdvharictutar) }}
                  </template>
                  <template #[`item.kdvtutari`]="{ item }">
                    {{ formatCurrency(item.kdvtutari) }}
                  </template>
                  <template #[`item.indirimtutari`]="{ item }">
                    {{ formatCurrency(item.indirimtutari) }}
                  </template>
                  <template #[`item.toplamtutar`]="{ item }">
                    {{ formatCurrency(item.toplamtutar) }}
                  </template>
                </v-data-table>
              </v-sheet>
            </td>
          </tr>
        </template>
      </v-data-table>

      <v-data-table
        :items="generalReport.bankReceipts.result"
        class="rounded-lg elevation-0 border mb-5"
        no-data-text="Fiş bulunamadı."
        items-per-page-text="Sayfa başı fiş"
        :mobile="mobile.value"
        fixed-header
        :headers="includedBankReceiptsDataTableHeaders"
        hover
      >
        <template #top>
          <v-toolbar flat rounded class="rounded-b-0">
            <v-toolbar-title>
              <v-icon color="medium-emphasis" icon="mdi-text" size="x-small" start />
              Banka Giriş Fişleri
            </v-toolbar-title>

            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border me-5"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="bankReceiptsDataTableHeaders"
            />
          </v-toolbar>
        </template>
        <template #[`item.borc`]="{ item }">
          {{ formatCurrency(item.borc) }}
        </template>
      </v-data-table>

      <v-data-table
        :items="generalReport.creditCardCollections.result"
        class="rounded-lg elevation-0 border mb-5"
        no-data-text="Kredi kartı tahsilatı bulunamadı."
        items-per-page-text="Sayfa başı tahsilat"
        :mobile="mobile.value"
        fixed-header
        :headers="includedCreditCardCollectionsDataTableHeaders"
        hover
      >
        <template #top>
          <v-toolbar flat rounded class="rounded-b-0">
            <v-toolbar-title>
              <v-icon color="medium-emphasis" icon="mdi-credit-card" size="x-small" start />
              Kredi Kartı Tahsilatları
            </v-toolbar-title>

            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border me-5"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="creditCardCollectionsDataTableHeaders"
            />
          </v-toolbar>
        </template>
        <template #[`item.toplamtutar`]="{ item }">
          {{ formatCurrency(item.toplamtutar) }}
        </template>
      </v-data-table>

      <v-sheet rounded="lg" class="ma-auto w-50 pa-10">
        <v-container class="pa-0" fluid>
          <v-row>
            <v-col class="text-center">
              <span class="text-h4 font-weight-bold">Nakit Girişleri</span>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-row class="align-center">
            <v-col cols="auto">
              <span class="text-h5">Kasa Bakiye Toplamı</span>
            </v-col>
            <v-spacer />
            <v-col cols="auto">
              <span class="text-h6"
                >{{ formatCurrency(generalReport.cashAccountsBalanceSum) }} TL</span
              >
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>
    </motion.div>
  </v-container>
</template>

<style scoped>
.controls-row {
  width: 100%;
}
@media screen and (min-width: 768px) {
  .controls-row {
    width: 75%;
  }
}
</style>
