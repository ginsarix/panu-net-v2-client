<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { addDays, format, isBefore, isEqual } from 'date-fns';
import { AnimatePresence, motion } from 'motion-v';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { VDateInput } from 'vuetify/labs/VDateInput';
import { VIconBtn } from 'vuetify/labs/VIconBtn';

import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { getGeneralReport } from '@/services/api/reports';
import { useDisplayStore } from '@/stores/display';
import type { DataTableHeaders } from '@/types/data-table-headers';
import { uniqueBy } from '@/utils/array';
import { formatCurrency } from '@/utils/formatting';

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
  materialReceipts: generalReport.value
    ? uniqueBy(generalReport.value.materialReceipts.result, 'fisno')
    : undefined,
}));

const getWaybillItems = (fisno: string) =>
  generalReport.value?.waybills.result.filter((w) => w.fisno === fisno);
const getInvoiceItems = (fisno: string) =>
  generalReport.value?.invoices.result.filter((w) => w.fisno === fisno);
const getMaterialReceiptItems = (fisno: string) =>
  generalReport.value?.materialReceipts.result.filter((m) => m.fisno === fisno);

const loading = ref(false);
const error = ref('');

const requestedStartDateFilter = ref<Date>();
const requestedEndDateFilter = ref<Date>();

const startDateFilter = ref(new Date());
const endDateFilter = ref(addDays(new Date(), 1));

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

const { stop: stopWatch } = watch(generalReport, async (newGeneralReport) => {
  if (newGeneralReport) {
    useCompanyPeriodWatcher(loadGeneralReport);

    stopWatch();
  }
});

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

const materialReceiptsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Fiş No', key: 'fisno', toggled: true, sortable: true },
  { title: 'Cari Ünvan', key: 'cariunvan', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'aciklama', toggled: true, sortable: false },
  { title: 'Tür', key: 'turuack', toggled: true, sortable: true },
  { title: 'Toplam', key: 'toplam', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const materialReceiptsItemsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Stok Kodu', key: 'stokkodu', toggled: true, sortable: true },
  { title: 'Stok Adı', key: 'stokadi', toggled: true, sortable: false },
  { title: 'Döviz', key: 'doviz', toggled: true, sortable: true },
  { title: 'Birim', key: 'birim', toggled: true, sortable: true },
  { title: 'Miktar', key: 'miktar', toggled: true, sortable: true },
  { title: 'Toplam', key: 'toplam', toggled: true, sortable: true },
]);

const includedMaterialReceiptsDataTableHeaders = computed(() =>
  materialReceiptsDataTableHeaders.value.filter((header) => header.toggled),
);

const checkEntriesDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Bordro No', key: 'bordrono', toggled: true, sortable: true },
  { title: 'Tutar', key: 'tutar', toggled: true, sortable: true },
  { title: 'Döviz', key: 'doviz', toggled: true, sortable: true },
  { title: 'Vade', key: 'vade', toggled: true, sortable: true },
  { title: 'Cirolu', key: 'cirolu', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'aciklama', toggled: true, sortable: false },
  { title: 'Banka Adı', key: 'bankadi', toggled: true, sortable: true },
  { title: 'Borçlu', key: 'borclu', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const includedCheckEntriesDataTableHeaders = computed(() =>
  checkEntriesDataTableHeaders.value.filter((header) => header.toggled),
);

const refreshRotation = ref(0);

// scroll navigation
const showScrollNav = computed(() => generalReport.value && !loading.value);
const scrollNavItems = ref([
  { id: 'waybills', label: 'İrsaliyeler', icon: 'mdi-text' },
  { id: 'invoices', label: 'Faturalar', icon: 'mdi-file-document' },
  { id: 'bank-receipts', label: 'Banka Fişleri', icon: 'mdi-bank' },
  { id: 'credit-card-collections', label: 'Kredi Kartı Tahsilatları', icon: 'mdi-credit-card' },
  { id: 'material-receipts', label: 'Malzeme Fişleri', icon: 'mdi-package-variant' },
  { id: 'check-entries', label: 'Çek Girişleri', icon: 'mdi-checkbook' },
  { id: 'cash-summary', label: 'Nakit Girişleri', icon: 'mdi-cash' },
  { id: 'account-cards', label: 'Cari Kartları', icon: 'mdi-account' },
  { id: 'purchased-services-invoices', label: 'Alınan Hizmetler', icon: 'mdi-invoice-text' },
]);

const refresh = async () => {
  if (loading.value) return;

  refreshRotation.value += 360;

  await loadGeneralReport();
};

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  }
};
</script>

<template>
  <v-container fluid class="pa-6">
    <v-row class="align-center mb-6">
      <v-col cols="12" sm="8" class="mb-2 mb-sm-0">
        <h2 class="text-h4 mb-4 mb-sm-0 text-center text-sm-start">Genel Rapor</h2>
      </v-col>
      <v-col cols="12" sm="4" class="d-flex justify-end justify-center-sm">
        <motion.div
          v-if="showScrollNav"
          :initial="{ scale: 0.9, opacity: 0 }"
          :animate="{ scale: 1, opacity: 1 }"
          :transition="{ duration: 0.25, ease: 'easeOut' }"
          class="w-100 d-flex justify-end"
        >
          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" rounded="lg" color="primary" class="w-100 w-sm-auto">
                Bölümlere Git
              </v-btn>
            </template>

            <v-list>
              <v-list-item
                v-for="item in scrollNavItems"
                :key="item.id"
                :value="item.id"
                :prepend-icon="item.icon"
                @click.stop="scrollToSection(item.id)"
              >
                <v-list-item-title>{{ item.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </motion.div>
      </v-col>
    </v-row>

    <v-divider class="mb-2" />

    <span class="text-medium-emphasis"> Dönem tarihini geçersiz kılmaz </span>

    <v-row class="mb-2 mt-1 controls-row">
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
            v-if="generalReport && datesValid"
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
                  :disabled="loading"
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
      <v-card id="waybills" class="report-section-card mb-6" elevation="2" border>
        <v-card-title class="pa-4 bg-primary-lighten-5 border-b">
          <div class="d-flex align-center w-100">
            <v-avatar color="primary" size="40" class="me-3">
              <v-icon icon="mdi-text" color="white" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">İrsaliyeler</div>
              <div class="text-caption text-medium-emphasis">
                {{ generalReportUniques.waybills?.length || 0 }} adet irsaliye
              </div>
            </div>
            <v-spacer />
            <v-chip
              v-if="generalReportUniques.waybills?.length"
              color="primary"
              variant="tonal"
              class="me-3"
            >
              {{
                formatCurrency(
                  generalReportUniques.waybills
                    ?.map(
                      (w) =>
                        getWaybillItems(w.fisno)
                          ?.map((item) => Number(item.toplamtutar))
                          .reduce((acc, val) => acc + val, 0) ?? 0,
                    )
                    .reduce((acc, val) => acc + val, 0) ?? 0,
                )
              }}
              TL
            </v-chip>
            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="waybillDataTableHeaders"
            />
          </div>
        </v-card-title>

        <v-data-table
          :items="generalReportUniques.waybills"
          class="rounded-b-lg"
          no-data-text="İrsaliye bulunamadı."
          items-per-page-text="Sayfa başı irsaliye"
          :mobile="mobile.value"
          fixed-header
          :headers="includedWaybillDataTableHeaders"
          hover
          show-expand
          item-value="fisno"
        >
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
      </v-card>

      <v-card id="invoices" class="report-section-card mb-6" elevation="2" border>
        <v-card-title class="pa-4 bg-success-lighten-5 border-b">
          <div class="d-flex align-center w-100">
            <v-avatar color="success" size="40" class="me-3">
              <v-icon icon="mdi-file-document" color="white" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">Faturalar</div>
              <div class="text-caption text-medium-emphasis">
                {{ generalReportUniques.invoices?.length || 0 }} adet fatura
              </div>
            </div>
            <v-spacer />
            <v-chip
              v-if="generalReportUniques.invoices?.length"
              color="success"
              variant="tonal"
              class="me-3"
            >
              {{
                formatCurrency(
                  generalReportUniques.invoices
                    ?.map(
                      (i) =>
                        getInvoiceItems(i.fisno)
                          ?.map((item) => Number(item.toplamtutar))
                          .reduce((acc, val) => acc + val, 0) ?? 0,
                    )
                    .reduce((acc, val) => acc + val, 0) ?? 0,
                )
              }}
              TL
            </v-chip>
            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="invoiceDataTableHeaders"
            />
          </div>
        </v-card-title>

        <v-data-table
          :items="generalReportUniques.invoices"
          class="rounded-b-lg"
          no-data-text="Fatura bulunamadı."
          items-per-page-text="Sayfa başı fatura"
          :mobile="mobile.value"
          fixed-header
          :headers="includedInvoiceDataTableHeaders"
          hover
          show-expand
          item-value="fisno"
        >
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
      </v-card>

      <v-card id="bank-receipts" class="report-section-card mb-6" elevation="2" border>
        <v-card-title class="pa-4 bg-info-lighten-5 border-b">
          <div class="d-flex align-center w-100">
            <v-avatar color="info" size="40" class="me-3">
              <v-icon icon="mdi-bank" color="white" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">Banka Giriş Fişleri</div>
              <div class="text-caption text-medium-emphasis">
                {{ generalReport.bankReceipts.result?.length || 0 }} adet fiş
              </div>
            </div>
            <v-spacer />
            <v-chip
              v-if="generalReport.bankReceipts.result?.length"
              color="info"
              variant="tonal"
              class="me-3"
            >
              {{
                formatCurrency(
                  generalReport.bankReceipts.result
                    ?.map((item) => Number(item.borc))
                    .reduce((acc, val) => acc + val, 0) ?? 0,
                )
              }}
              TL
            </v-chip>
            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="bankReceiptsDataTableHeaders"
            />
          </div>
        </v-card-title>

        <v-data-table
          :items="generalReport.bankReceipts.result"
          class="rounded-b-lg"
          no-data-text="Fiş bulunamadı."
          items-per-page-text="Sayfa başı fiş"
          :mobile="mobile.value"
          fixed-header
          :headers="includedBankReceiptsDataTableHeaders"
          hover
        >
          <template #[`item.borc`]="{ item }">
            {{ formatCurrency(item.borc) }}
          </template>
        </v-data-table>
      </v-card>

      <v-card id="credit-card-collections" class="report-section-card mb-6" elevation="2" border>
        <v-card-title class="pa-4 bg-warning-lighten-5 border-b">
          <div class="d-flex align-center w-100">
            <v-avatar color="warning" size="40" class="me-3">
              <v-icon icon="mdi-credit-card" color="white" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">Kredi Kartı Tahsilatları</div>
              <div class="text-caption text-medium-emphasis">
                {{ generalReport.creditCardCollections.result?.length || 0 }} adet tahsilat
              </div>
            </div>
            <v-spacer />
            <v-chip
              v-if="generalReport.creditCardCollections.result?.length"
              color="warning"
              variant="tonal"
              class="me-3"
            >
              {{
                formatCurrency(
                  generalReport.creditCardCollections.result
                    ?.map((item) => Number(item.toplamtutar))
                    .reduce((acc, val) => acc + val, 0) ?? 0,
                )
              }}
              TL
            </v-chip>
            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="creditCardCollectionsDataTableHeaders"
            />
          </div>
        </v-card-title>

        <v-data-table
          :items="generalReport.creditCardCollections.result"
          class="rounded-b-lg"
          no-data-text="Kredi kartı tahsilatı bulunamadı."
          items-per-page-text="Sayfa başı tahsilat"
          :mobile="mobile.value"
          fixed-header
          :headers="includedCreditCardCollectionsDataTableHeaders"
          hover
        >
          <template #[`item.toplamtutar`]="{ item }">
            {{ formatCurrency(item.toplamtutar) }}
          </template>
        </v-data-table>
      </v-card>

      <v-card id="material-receipts" class="report-section-card mb-6" elevation="2" border>
        <v-card-title class="pa-4 bg-secondary-lighten-5 border-b">
          <div class="d-flex align-center w-100">
            <v-avatar color="secondary" size="40" class="me-3">
              <v-icon icon="mdi-package-variant" color="white" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">Malzeme Fişleri</div>
              <div class="text-caption text-medium-emphasis">
                {{ generalReportUniques.materialReceipts?.length || 0 }} adet malzeme fişi
              </div>
            </div>
            <v-spacer />
            <v-chip
              v-if="generalReportUniques.materialReceipts?.length"
              color="secondary"
              variant="tonal"
              class="me-3"
            >
              {{
                formatCurrency(
                  generalReportUniques.materialReceipts
                    ?.map(
                      (m) =>
                        getMaterialReceiptItems(m.fisno)
                          ?.map((item) => Number(item.toplam))
                          .reduce((acc, val) => acc + val, 0) ?? 0,
                    )
                    .reduce((acc, val) => acc + val, 0) ?? 0,
                )
              }}
              TL
            </v-chip>
            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="materialReceiptsDataTableHeaders"
            />
          </div>
        </v-card-title>

        <v-data-table
          :items="generalReportUniques.materialReceipts"
          class="rounded-b-lg"
          no-data-text="Malzeme fişi bulunamadı."
          items-per-page-text="Sayfa başı malzeme fişi"
          :mobile="mobile.value"
          fixed-header
          :headers="includedMaterialReceiptsDataTableHeaders"
          hover
          show-expand
          item-value="fisno"
        >
          <template #[`item.toplam`]="{ item: { fisno } }">
            {{
              formatCurrency(
                getMaterialReceiptItems(fisno)
                  ?.map((m) => Number(m.toplam))
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
                    :headers="materialReceiptsItemsDataTableHeaders"
                    :items="getMaterialReceiptItems(item.fisno)"
                    hide-default-footer
                  >
                    <template #[`item.miktar`]="{ item }">
                      {{ Number(item.miktar).toFixed(2) }}
                    </template>
                    <template #[`item.toplam`]="{ item }">
                      {{ formatCurrency(item.toplam) }}
                    </template>
                  </v-data-table>
                </v-sheet>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

      <v-card id="check-entries" class="report-section-card mb-6" elevation="2" border>
        <v-card-title class="pa-4 border-b">
          <div class="d-flex align-center w-100">
            <v-avatar color="purple" size="40" class="me-3">
              <v-icon icon="mdi-checkbook" color="white" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">Çek Girişleri</div>
              <div class="text-caption text-medium-emphasis">
                {{ generalReport.checkEntries.result?.length || 0 }} adet çek girişi
              </div>
            </div>
            <v-spacer />
            <v-chip
              v-if="generalReport.checkEntries.result?.length"
              color="purple"
              variant="tonal"
              class="me-3"
            >
              {{
                formatCurrency(
                  generalReport.checkEntries.result
                    ?.map((item) => Number(item.tutar))
                    .reduce((acc, val) => acc + val, 0) ?? 0,
                )
              }}
              TL
            </v-chip>
            <GixTogglerMenu
              menu-activator-btn-text="Filtrele"
              menu-activator-btn-class="rounded-lg border"
              menu-activator-btn-icon="mdi-filter-variant"
              v-model:toggle-items="checkEntriesDataTableHeaders"
            />
          </div>
        </v-card-title>

        <v-data-table
          :items="generalReport.checkEntries.result"
          class="rounded-b-lg"
          no-data-text="Çek girişi bulunamadı."
          items-per-page-text="Sayfa başı çek girişi"
          :mobile="mobile.value"
          fixed-header
          :headers="includedCheckEntriesDataTableHeaders"
          hover
        >
          <template #[`item.tutar`]="{ item }">
            {{ formatCurrency(item.tutar) }}
          </template>
          <template #[`item.vade`]="{ item }">
            {{ format(item.vade, 'dd.MM.yyyy') }}
          </template>
          <template #[`item.cirolu`]="{ item }">
            <v-chip
              :color="item.cirolu === 'E' ? 'success' : 'warning'"
              variant="tonal"
              size="small"
            >
              {{ item.cirolu === 'E' ? 'Evet' : 'Hayır' }}
            </v-chip>
          </template>
        </v-data-table>
      </v-card>

      <v-card id="cash-summary" class="summary-card mb-6" elevation="3" rounded="xl" border>
        <v-card-text class="pa-6 pa-sm-8 pa-md-10">
          <div class="d-flex align-center mb-4">
            <v-avatar color="success" size="48" class="me-4">
              <v-icon icon="mdi-cash" color="white" size="24" />
            </v-avatar>
            <div>
              <div class="text-h5 text-sm-h4 font-weight-bold">Nakit Girişleri</div>
              <div class="text-caption text-medium-emphasis">Kasa bakiyeleri özeti</div>
            </div>
          </div>

          <v-divider class="mb-4" />

          <div class="py-2">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6 text-sm-h5 font-weight-medium">Kasa Bakiye Toplamı</div>
                <div class="text-caption text-medium-emphasis">Tüm hesapların toplam bakiyesi</div>
              </div>
              <div class="text-right">
                <div class="text-h5 text-sm-h4 font-weight-bold text-success">
                  {{ formatCurrency(generalReport.cashAccountsBalanceSum) }} TL
                </div>
                <div class="text-caption text-medium-emphasis">Toplam bakiye</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card id="account-cards" class="summary-card mb-6" elevation="3" rounded="xl" border>
        <v-card-text class="pa-6 pa-sm-8 pa-md-10">
          <div class="d-flex align-center mb-4">
            <v-avatar color="info" size="48" class="me-4">
              <v-icon icon="mdi-account" color="white" size="24" />
            </v-avatar>
            <div>
              <div class="text-h5 text-sm-h4 font-weight-bold">Cari Kartları</div>
              <div class="text-caption text-medium-emphasis">Alacaklı ve borçlu hesaplar özeti</div>
            </div>
          </div>

          <v-divider class="mb-4" />

          <div class="py-2">
            <div class="d-flex justify-space-between align-center mb-4">
              <div>
                <div class="text-h6 text-sm-h5 font-weight-medium">Alacaklı Toplamı</div>
                <div class="text-caption text-medium-emphasis">Müşterilerden alınacak tutarlar</div>
              </div>
              <div class="text-right">
                <div class="text-h5 text-sm-h4 font-weight-bold text-success">
                  {{ formatCurrency(generalReport.accountCardsCreditorSum) }} TL
                </div>
                <div class="text-caption text-medium-emphasis">Alacak bakiyesi</div>
              </div>
            </div>

            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6 text-sm-h5 font-weight-medium">Borçlu Toplamı</div>
                <div class="text-caption text-medium-emphasis">Tedarikçilere ödenecek tutarlar</div>
              </div>
              <div class="text-right">
                <div class="text-h5 text-sm-h4 font-weight-bold text-error">
                  {{ formatCurrency(generalReport.accountCardsDebtorSum) }} TL
                </div>
                <div class="text-caption text-medium-emphasis">Borç bakiyesi</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card
        id="purchased-services-invoices"
        class="summary-card mb-6"
        elevation="3"
        rounded="xl"
        border
      >
        <v-card-text class="pa-6 pa-sm-8 pa-md-10">
          <div class="d-flex align-center mb-4">
            <v-avatar color="warning" size="48" class="me-4">
              <v-icon icon="mdi-invoice-text" color="white" size="24" />
            </v-avatar>
            <div>
              <div class="text-h5 text-sm-h4 font-weight-bold">Alınan Hizmetler</div>
              <div class="text-caption text-medium-emphasis">Hizmet faturaları özeti</div>
            </div>
          </div>

          <v-divider class="mb-4" />

          <div class="py-2">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6 text-sm-h5 font-weight-medium">Tutar Toplamı</div>
                <div class="text-caption text-medium-emphasis">
                  Alınan hizmetlerin toplam tutarı
                </div>
              </div>
              <div class="text-right">
                <div class="text-h5 text-sm-h4 font-weight-bold text-warning">
                  {{ formatCurrency(generalReport.purchasedServicesInvoicesSum) }} TL
                </div>
                <div class="text-caption text-medium-emphasis">Toplam hizmet tutarı</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
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

/* Minimal custom styles - using Vuetify utilities where possible */
.report-section-card {
  transition: all 0.3s ease;
}

.report-section-card:hover {
  transform: translateY(-2px);
}

.summary-card {
  transition: all 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-4px);
}

/* Animation enhancements */
.report-section-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.report-section-card:nth-child(1) {
  animation-delay: 0.1s;
}
.report-section-card:nth-child(2) {
  animation-delay: 0.2s;
}
.report-section-card:nth-child(3) {
  animation-delay: 0.3s;
}
.report-section-card:nth-child(4) {
  animation-delay: 0.4s;
}
.report-section-card:nth-child(5) {
  animation-delay: 0.5s;
}
</style>
