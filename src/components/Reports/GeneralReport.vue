<script setup lang="ts">
import { TRPCClientError } from '@trpc/client';
import { addDays, format, isBefore, isEqual } from 'date-fns';
import { AnimatePresence, motion } from 'motion-v';
import { storeToRefs } from 'pinia';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { VDateInput } from 'vuetify/labs/VDateInput';

import { useColumnFilters } from '@/composables/useColumnFilters';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useCompanyPeriodWatcher } from '@/composables/useCompanyPeriodWatcher';
import { getCashAccountMovements, getGeneralReport } from '@/services/api/reports';
import { useDisplayStore } from '@/stores/display';
import type { DataTableHeaders } from '@/types/data-table-headers';
import { uniqueBy } from '@/utils/array';
import { buildGroupedSumChartData } from '@/utils/chart';
import { formatToLocale } from '@/utils/formatting';

import GixTogglerMenu from '../GixTogglerMenu.vue';

const GixChart = defineAsyncComponent(() => import('../GixChart.vue'));
const GixBarChart = defineAsyncComponent(() => import('../GixBarChart.vue'));

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

// precompute items for o(1) lookups
type WaybillItem = GeneralReportReturnType['waybills']['result'][number];
type InvoiceItem = GeneralReportReturnType['invoices']['result'][number];
type MaterialReceiptItem = GeneralReportReturnType['materialReceipts']['result'][number];

const waybillItemsByFisno = computed(() => {
  const map = new Map<string, WaybillItem[]>();
  if (!generalReport.value) return map;
  for (const item of generalReport.value.waybills.result) {
    const group = map.get(item.fisno);
    if (group) group.push(item);
    else map.set(item.fisno, [item]);
  }
  return map;
});

const invoiceItemsByFisno = computed(() => {
  const map = new Map<string, InvoiceItem[]>();
  if (!generalReport.value) return map;
  for (const item of generalReport.value.invoices.result) {
    const group = map.get(item.fisno);
    if (group) group.push(item);
    else map.set(item.fisno, [item]);
  }
  return map;
});

const materialReceiptItemsByFisno = computed(() => {
  const map = new Map<string, MaterialReceiptItem[]>();
  if (!generalReport.value) return map;
  for (const item of generalReport.value.materialReceipts.result) {
    const group = map.get(item.fisno);
    if (group) group.push(item);
    else map.set(item.fisno, [item]);
  }
  return map;
});

//

const waybillFiltersTogglerItems = ref([
  { key: '1', title: 'Mal Alım', toggled: true },
  { key: '4', title: 'Konsinye Giriş', toggled: true },
  { key: '6', title: 'Mal Alım İade', toggled: true },
  { key: '9', title: 'Konsinye Giriş İade', toggled: true },
  { key: '12', title: 'Özel Giriş', toggled: true },
  { key: '15', title: 'Müstahsil İrsaliyesi', toggled: true },
  { key: '2', title: 'Perakende Satış', toggled: true },
  { key: '3', title: 'Toptan Satış', toggled: true },
  { key: '5', title: 'Konsinye Çıkış', toggled: true },
  { key: '7', title: 'Perakende Satış İade', toggled: true },
  { key: '8', title: 'Toptan Satış İade', toggled: true },
  { key: '11', title: 'Konsinye Çıkış İade', toggled: true },
  { key: '13', title: 'Özel Çıkış', toggled: true },
]);

const invoiceFiltersTogglerItems = ref([
  { key: '1', title: 'Mal Alım', toggled: true },
  { key: '4', title: 'Alınan Hizmet', toggled: true },
  { key: '6', title: 'Alım İade', toggled: true },
  { key: '15', title: 'Müstahsil Makbuzu', toggled: true },
  { key: '7', title: 'Perakende Satış İade', toggled: true },
  { key: '8', title: 'Toptan Satış İade', toggled: true },
  { key: '2', title: 'Perakende Satış', toggled: true },
  { key: '3', title: 'Toptan Satış', toggled: true },
  { key: '5', title: 'Verilen Hizmet', toggled: true },
  { key: '9', title: 'Alınan Fiyat Farkı', toggled: true },
  { key: '10', title: 'Verilen Fiyat Farkı', toggled: true },
]);

const materialReceiptsFiltersTogglerItems = ref([
  { key: '1', title: 'Depo Fişi (Transfer)', toggled: true },
  { key: '3', title: 'Sarf Fişi', toggled: true },
  { key: '8', title: 'Sair Giriş', toggled: true },
  { key: '9', title: 'Sair Çıkış', toggled: true },
]);

const bankReceiptsFiltersTogglerItems = ref([
  { key: 'BNK', title: 'Banka Fişi', toggled: true },
  { key: 'VRM', title: 'Virman', toggled: true },
  { key: 'GOHVL', title: 'Gönderici Hesap', toggled: true },
  { key: 'GEHVL', title: 'Gelen Havale', toggled: true },
  { key: 'KF', title: 'Kur Farkı Fişi', toggled: true },
  { key: 'ACLS', title: 'Açılış Fişi', toggled: true },
]);

// get toggled keys from filter items
const getToggledKeys = (items: { key: string; toggled: boolean }[]) =>
  items.filter((item) => item.toggled).map((item) => item.key);

// toggle filtered data
const filteredWaybills = computed(() => {
  if (!generalReportUniques.value.waybills) return [];
  const toggledKeys = getToggledKeys(waybillFiltersTogglerItems.value);
  return generalReportUniques.value.waybills.filter((w) => toggledKeys.includes(w.turu));
});

const filteredInvoices = computed(() => {
  if (!generalReportUniques.value.invoices) return [];
  const toggledKeys = getToggledKeys(invoiceFiltersTogglerItems.value);
  return generalReportUniques.value.invoices.filter((i) => toggledKeys.includes(i.turu));
});

const filteredMaterialReceipts = computed(() => {
  if (!generalReportUniques.value.materialReceipts) return [];
  const toggledKeys = getToggledKeys(materialReceiptsFiltersTogglerItems.value);
  return generalReportUniques.value.materialReceipts.filter((m) => toggledKeys.includes(m.turu));
});

const filteredBankReceipts = computed(() => {
  if (!generalReport.value?.bankReceipts) return [];
  const toggledKeys = getToggledKeys(bankReceiptsFiltersTogglerItems.value);
  return generalReport.value.bankReceipts.result.filter((b) => toggledKeys.includes(b.turu));
});

// toggle filtered raw data for chart
const filteredWaybillsRaw = computed(() => {
  if (!generalReport.value?.waybills) return [];
  const toggledKeys = getToggledKeys(waybillFiltersTogglerItems.value);
  return generalReport.value.waybills.result.filter((w) => toggledKeys.includes(w.turu));
});

const filteredInvoicesRaw = computed(() => {
  if (!generalReport.value?.invoices) return [];
  const toggledKeys = getToggledKeys(invoiceFiltersTogglerItems.value);
  return generalReport.value.invoices.result.filter((i) => toggledKeys.includes(i.turu));
});

const filteredMaterialReceiptsRaw = computed(() => {
  if (!generalReport.value?.materialReceipts) return [];
  const toggledKeys = getToggledKeys(materialReceiptsFiltersTogglerItems.value);
  return generalReport.value.materialReceipts.result.filter((m) => toggledKeys.includes(m.turu));
});

const filteredBankReceiptsRaw = computed(() => {
  if (!generalReport.value?.bankReceipts) return [];
  const toggledKeys = getToggledKeys(bankReceiptsFiltersTogglerItems.value);
  return generalReport.value.bankReceipts.result.filter((b) => toggledKeys.includes(b.turu));
});

useColumnFilters('waybills', waybillFiltersTogglerItems);
useColumnFilters('invoices', invoiceFiltersTogglerItems);
useColumnFilters('material-receipts', materialReceiptsFiltersTogglerItems);
useColumnFilters('bank-receipts', bankReceiptsFiltersTogglerItems);

const cashAccountMovements = ref<Awaited<ReturnType<typeof getCashAccountMovements>>>();

const cashAccountMovementsLoadingStates = ref<Record<string, boolean>>({});

const loadCashAccountMovements = async (cashAccountKey: string) => {
  if (cashAccountMovements.value?.some((c) => c.cashAccountKey === cashAccountKey)) return;

  cashAccountMovementsLoadingStates.value[cashAccountKey] = true;

  const newCashAccountMovements = await getCashAccountMovements(cashAccountKey);
  cashAccountMovements.value = [...(cashAccountMovements.value ?? []), ...newCashAccountMovements];

  cashAccountMovementsLoadingStates.value[cashAccountKey] = false;
};

const cashAccountMovementsGraphStates = ref<Record<string, boolean>>({});

const toggleCashAccountMovementsGraph = (cashAccountKey: string) => {
  cashAccountMovementsGraphStates.value[cashAccountKey] =
    !cashAccountMovementsGraphStates.value[cashAccountKey];
};

const isCashAccountMovementsGraphOpen = (cashAccountKey: string) =>
  cashAccountMovementsGraphStates.value[cashAccountKey] ?? false;

const getCashAccountMovementItems = (cashAccountKey: string) =>
  cashAccountMovements.value?.filter((c) => c.cashAccountKey === cashAccountKey);

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

const waybillChartData = computed(() => {
  if (!filteredWaybillsRaw.value.length) {
    return { legendData: [], seriesData: [] };
  }

  return buildGroupedSumChartData<{
    turuack?: string;
    toplamtutar?: string | number;
  }>(
    filteredWaybillsRaw.value,
    (w) => w.turuack,
    (w) => w.toplamtutar,
  );
});

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

const invoiceChartData = computed(() => {
  if (!filteredInvoicesRaw.value.length) {
    return { legendData: [], seriesData: [] };
  }

  return buildGroupedSumChartData<{
    turuack?: string;
    toplamtutar?: string | number;
  }>(
    filteredInvoicesRaw.value,
    (i) => i.turuack,
    (i) => i.toplamtutar,
  );
});
const includedInvoiceDataTableHeaders = computed(() =>
  invoiceDataTableHeaders.value.filter((header) => header.toggled),
);

const bankReceiptsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Fiş No', key: 'fisno', toggled: true, sortable: true },
  { title: 'Cari Ünvan/Hizmet Açıklama', key: 'cariunvan', toggled: true, sortable: false },
  { title: 'Tür', key: 'turuack', toggled: true, sortable: true },
  { title: 'Döviz', key: 'doviz', toggled: true, sortable: true },
  { title: 'Alacak', key: 'alacak', toggled: true, sortable: true },
  { title: 'Borç', key: 'borc', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'kalemaciklama', toggled: true, sortable: false },
  { title: 'Fiş Açıklaması', key: 'aciklama', toggled: true, sortable: false },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const bankReceiptsChartData = computed(() => {
  if (!filteredBankReceiptsRaw.value.length) {
    return { credit: { legendData: [], seriesData: [] }, debt: { legendData: [], seriesData: [] } };
  }

  return {
    credit: buildGroupedSumChartData<{
      turuack?: string;
      alacak?: string | number;
    }>(
      filteredBankReceiptsRaw.value,
      (i) => i.turuack,
      (i) => i.alacak,
    ),
    debt: buildGroupedSumChartData<{
      turuack?: string;
      borc?: string | number;
    }>(
      filteredBankReceiptsRaw.value,
      (i) => i.turuack,
      (i) => i.borc,
    ),
  };
});

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

const cashAccountsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Adı', key: 'adi', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'aciklama', toggled: true, sortable: false },
  { title: 'B/A', key: 'ba', toggled: true, sortable: true },
  { title: 'Borç', key: 'borc', toggled: true, sortable: true },
  { title: 'Alacak', key: 'alacak', toggled: true, sortable: true },
  { title: 'Bakiye', key: 'bakiye', toggled: true, sortable: true },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const cashAccountChartData = computed(() => {
  if (!generalReport.value || !generalReport.value.cashAccounts) {
    return { legendData: [], seriesData: [] };
  }

  return buildGroupedSumChartData<{
    adi?: string;
    bakiye?: string | number;
  }>(
    generalReport.value.cashAccounts,
    (c) => c.adi,
    (c) => c.bakiye,
  );
});

const cashAccountMovementsDataTableHeaders = ref<DataTableHeaders[]>([
  { title: 'Fiş No', key: 'fisno', toggled: true, sortable: true },
  { title: 'Tür', key: 'turuack', toggled: true, sortable: true },
  { title: 'Alacak', key: 'alacak', toggled: true, sortable: true },
  { title: 'Borç', key: 'borc', toggled: true, sortable: true },
  { title: 'Bakiye', key: 'bakiye', toggled: true, sortable: true },
  { title: 'Açıklama', key: 'aciklama', toggled: true, sortable: false },
  { title: 'Oluşturulma Tarihi', key: '_cdate', toggled: true, sortable: true },
]);

const getCashAccountMovementsChartData = (cashAccountKey: string) => {
  if (!generalReport.value || !cashAccountMovements.value) {
    return { axisData: [], barSeriesData: [] };
  }

  const data = buildGroupedSumChartData<{
    turuack?: string;
    bakiye?: string | number;
  }>(
    cashAccountMovements.value.filter((c) => c.cashAccountKey === cashAccountKey),
    (c) => c.turuack,
    (c) => c.bakiye,
  ).seriesData;

  return { axisData: data.map((s) => s.name), barSeriesData: data.map((s) => Number(s.value)) };
};

const includedCashAccountsDataTableHeaders = computed(() =>
  cashAccountsDataTableHeaders.value.filter((header) => header.toggled),
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

const materialReceiptsChartData = computed(() => {
  if (!filteredMaterialReceiptsRaw.value.length) {
    return { legendData: [], seriesData: [] };
  }

  return buildGroupedSumChartData<{
    turuack?: string;
    toplam?: string | number;
  }>(
    filteredMaterialReceiptsRaw.value,
    (m) => m.turuack,
    (m) => m.toplam,
  );
});

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

const showWaybillChart = ref(false);
const showInvoiceChart = ref(false);
const showBankReceiptsChart = ref(false);
const showMaterialReceiptsChart = ref(false);
const showCashAccountChart = ref(false);

// scroll navigation
const showScrollNav = computed(() => generalReport.value && !loading.value);
const scrollNavItems = ref([
  { id: 'waybills', label: 'İrsaliyeler', icon: 'mdi-text' },
  { id: 'invoices', label: 'Faturalar', icon: 'mdi-file-document' },
  { id: 'bank-receipts', label: 'Banka Fiş Kalemleri', icon: 'mdi-bank' },
  { id: 'credit-card-collections', label: 'Kredi Kartı Tahsilatları', icon: 'mdi-credit-card' },
  { id: 'material-receipts', label: 'Malzeme Fişleri', icon: 'mdi-package-variant' },
  { id: 'check-entries', label: 'Çek Girişleri', icon: 'mdi-checkbook' },
  { id: 'cash-accounts', label: 'Kasa Kartları Listesi', icon: 'mdi-cash' },
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

useColumnVisibility('waybills', waybillDataTableHeaders);
useColumnVisibility('invoices', invoiceDataTableHeaders);
useColumnVisibility('bank-receipts', bankReceiptsDataTableHeaders);
useColumnVisibility('material-receipts', materialReceiptsDataTableHeaders);
useColumnVisibility('check-entries', checkEntriesDataTableHeaders);
useColumnVisibility('cash-accounts', cashAccountsDataTableHeaders);
</script>

<template>
  <v-container fluid class="pa-2 pa-sm-4 pa-md-6">
    <v-row class="align-center mb-4 mb-sm-6">
      <v-col cols="12" sm="8" class="mb-2 mb-sm-0">
        <h2 class="text-h5 text-sm-h4 mb-4 mb-sm-0 text-center text-sm-start">Genel Rapor</h2>
      </v-col>
      <v-col cols="12" sm="4" class="d-flex justify-center justify-sm-end">
        <motion.div
          v-if="showScrollNav"
          :initial="{ scale: 0.9, opacity: 0 }"
          :animate="{ scale: 1, opacity: 1 }"
          :transition="{ duration: 0.25, ease: 'easeOut' }"
          class="w-100 d-flex justify-center justify-sm-end"
        >
          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" rounded="lg" color="primary" class="w-100 w-sm-auto">
                <span class="d-none d-sm-inline">Bölümlere Git</span>
                <span class="d-sm-none">Bölümler</span>
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
      <v-col cols="12" sm="5" md="4">
        <v-date-input
          v-model="startDateFilter"
          :display-format="(date: Date) => format(date, 'dd.MM.yyyy')"
          :error-messages="!startDateFilter ? ['Zorunlu alan'] : []"
          label="Başlama tarihi"
          placeholder="gg.AA.yyyy"
          rounded="lg"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" sm="5" md="4">
        <v-date-input
          v-model="endDateFilter"
          :display-format="(date: Date) => format(date, 'dd.MM.yyyy')"
          :error-messages="dateErrorMessage ? [dateErrorMessage] : []"
          label="Bitiş tarihi"
          placeholder="gg.AA.yyyy"
          rounded="lg"
          variant="outlined"
          density="compact"
        />
      </v-col>

      <v-col class="mt-2 pt-0 mt-sm-0 d-flex align-center" cols="12" sm="2" md="auto">
        <AnimatePresence>
          <motion.div
            v-if="generalReport && datesValid"
            key="refreshBtn"
            :initial="{ scale: 0, opacity: 0 }"
            :animate="{ scale: 1, opacity: 1 }"
            :exit="{ scale: 0, opacity: 0 }"
            :transition="{ type: 'spring', stiffness: 200, damping: 20 }"
          >
            <v-tooltip text="Raporu yenile" location="bottom">
              <template #activator="{ props }">
                <v-btn
                  v-show="!xs.value"
                  v-bind="props"
                  class="mb-2"
                  icon
                  height="40"
                  width="40"
                  :disabled="loading"
                  @click="refresh"
                >
                  <motion.span
                    :animate="{ rotate: refreshRotation }"
                    :transition="{ type: 'spring', stiffness: 200, damping: 20 }"
                    style="display: flex"
                  >
                    <v-icon>mdi-refresh</v-icon>
                  </motion.span>
                </v-btn>
              </template>
            </v-tooltip>
            <v-btn v-show="xs.value" class="text-none" @click="refresh">Yenile</v-btn>
          </motion.div>
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
        class="rounded-lg border mb-5"
      />
      <v-skeleton-loader elevation="2" type="card" class="rounded-xl border" />
    </template>
    <motion.div
      v-else
      :initial="{ scale: 0.9, opacity: 0 }"
      :animate="{ scale: 1, opacity: 1 }"
      :transition="{ duration: 0.25, ease: 'easeOut' }"
    >
      <v-card id="waybills" class="report-section-card mb-4 mb-sm-6" elevation="2" border>
        <v-card-title class="pa-3 pa-sm-4 bg-primary-lighten-5 border-b">
          <div
            class="d-flex flex-column flex-sm-row align-start align-sm-center w-100 gap-2 gap-sm-0"
          >
            <div class="d-flex align-center w-100 w-sm-auto">
              <v-avatar color="primary" class="me-2 me-sm-3 responsive-avatar">
                <v-icon icon="mdi-text" color="white" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 text-sm-h6 font-weight-bold">İrsaliyeler</div>
                <div class="text-caption text-medium-emphasis">
                  {{ filteredWaybills.length }} /
                  {{ generalReportUniques.waybills?.length || 0 }} adet irsaliye
                </div>
              </div>
            </div>
            <v-spacer class="d-none d-sm-flex" />
            <div
              class="d-flex flex-wrap gap-2 w-100 w-sm-auto justify-sm-end mt-sm-0 justify-space-between mt-3"
            >
              <GixTogglerMenu
                menu-activator-btn-text="Türler"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter"
                v-model:toggle-items="waybillFiltersTogglerItems"
              />

              <GixTogglerMenu
                class="ms-3"
                menu-activator-btn-text="Kolonlar"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter-variant"
                v-model:toggle-items="waybillDataTableHeaders"
              />

              <v-btn
                :prepend-icon="!xs.value ? 'mdi-chart-bar' : undefined"
                :icon="xs.value ? 'mdi-chart-bar' : undefined"
                variant="text"
                rounded="lg"
                class="ms-3 text-none"
                :text="!xs.value ? 'Tür Bazlı Grafik' : undefined"
                :append-icon="showWaybillChart ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                :size="xs.value ? 'small' : undefined"
                border
                @click="showWaybillChart = !showWaybillChart"
              />
            </div>
          </div>
        </v-card-title>

        <v-expand-transition v-show="showWaybillChart">
          <GixChart
            seriesName="Toplam Tutar"
            :seriesData="waybillChartData.seriesData"
            :data-formatter="formatToLocale"
            currency="TL"
            height="55vh"
          />
        </v-expand-transition>

        <v-divider class="my-4" />
        <v-data-table
          :items="filteredWaybills"
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
              formatToLocale(
                waybillItemsByFisno.get(fisno)?.reduce((sum, w) => sum + Number(w.tutari), 0) ?? 0,
              )
            }}
          </template>
          <template #[`item.kdvtutari`]="{ item: { fisno } }">
            {{
              formatToLocale(
                waybillItemsByFisno.get(fisno)?.reduce((sum, w) => sum + Number(w.kdvtutari), 0) ??
                  0,
              )
            }}
          </template>
          <template #[`item.indirimtutari`]="{ item: { fisno } }">
            {{
              formatToLocale(
                waybillItemsByFisno
                  .get(fisno)
                  ?.reduce((sum, w) => sum + Number(w.indirimtutari), 0) ?? 0,
              )
            }}
          </template>
          <template #[`item.toplamtutar`]="{ item: { fisno } }">
            {{
              formatToLocale(
                waybillItemsByFisno
                  .get(fisno)
                  ?.reduce((sum, w) => sum + Number(w.toplamtutar), 0) ?? 0,
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
                    :items="waybillItemsByFisno.get(item.fisno)"
                    hide-default-footer
                  >
                    <template #[`item.miktar`]>
                      {{ Number(item.miktar).toFixed(2) }}
                    </template>
                    <template #[`item.tutari`]="{ item }">
                      {{ formatToLocale(item.tutari) }}
                    </template>
                    <template #[`item.kdvtutari`]="{ item }">
                      {{ formatToLocale(item.kdvtutari) }}
                    </template>
                    <template #[`item.indirimtutari`]="{ item }">
                      {{ formatToLocale(item.indirimtutari) }}
                    </template>
                    <template #[`item.toplamtutar`]="{ item }">
                      {{ formatToLocale(item.toplamtutar) }}
                    </template>
                  </v-data-table>
                </v-sheet>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

      <v-card id="invoices" class="report-section-card mb-4 mb-sm-6" elevation="2" border>
        <v-card-title class="pa-3 pa-sm-4 bg-success-lighten-5 border-b">
          <div
            class="d-flex flex-column flex-sm-row align-start align-sm-center w-100 gap-2 gap-sm-0"
          >
            <div class="d-flex align-center w-100 w-sm-auto">
              <v-avatar color="success" class="me-2 me-sm-3 responsive-avatar">
                <v-icon icon="mdi-file-document" color="white" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 text-sm-h6 font-weight-bold">Faturalar</div>
                <div class="text-caption text-medium-emphasis">
                  {{ filteredInvoices.length }} /
                  {{ generalReportUniques.invoices?.length || 0 }} adet fatura
                </div>
              </div>
            </div>
            <v-spacer class="d-none d-sm-flex" />
            <div
              class="d-flex flex-wrap gap-2 w-100 w-sm-auto justify-sm-end mt-sm-0 justify-center mt-2"
            >
              <GixTogglerMenu
                menu-activator-btn-text="Türler"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter"
                v-model:toggle-items="invoiceFiltersTogglerItems"
              />

              <GixTogglerMenu
                class="ms-3"
                menu-activator-btn-text="Kolonlar"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter-variant"
                v-model:toggle-items="invoiceDataTableHeaders"
              />

              <v-btn
                :prepend-icon="!xs.value ? 'mdi-chart-bar' : undefined"
                :icon="xs.value ? 'mdi-chart-bar' : undefined"
                variant="text"
                rounded="lg"
                class="ms-3 text-none"
                :text="!xs.value ? 'Tür Bazlı Grafik' : undefined"
                :append-icon="showInvoiceChart ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                border
                :size="xs.value ? 'small' : undefined"
                @click="showInvoiceChart = !showInvoiceChart"
              />
            </div>
          </div>
        </v-card-title>

        <v-expand-transition v-show="showInvoiceChart">
          <GixChart
            seriesName="Toplam Tutar"
            :seriesData="invoiceChartData.seriesData"
            :data-formatter="formatToLocale"
            currency="TL"
            height="55vh"
          />
        </v-expand-transition>

        <v-data-table
          :items="filteredInvoices"
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
              formatToLocale(
                invoiceItemsByFisno
                  .get(fisno)
                  ?.reduce((sum, i) => sum + Number(i.kdvharictutar), 0) ?? 0,
              )
            }}
          </template>
          <template #[`item.kdvtutari`]="{ item: { fisno } }">
            {{
              formatToLocale(
                invoiceItemsByFisno.get(fisno)?.reduce((sum, i) => sum + Number(i.kdvtutari), 0) ??
                  0,
              )
            }}
          </template>
          <template #[`item.indirimtutari`]="{ item: { fisno } }">
            {{
              formatToLocale(
                invoiceItemsByFisno
                  .get(fisno)
                  ?.reduce((sum, i) => sum + Number(i.indirimtutari), 0) ?? 0,
              )
            }}
          </template>
          <template #[`item.toplamtutar`]="{ item: { fisno } }">
            {{
              formatToLocale(
                invoiceItemsByFisno
                  .get(fisno)
                  ?.reduce((sum, i) => sum + Number(i.toplamtutar), 0) ?? 0,
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
                    :items="invoiceItemsByFisno.get(item.fisno)"
                    hide-default-footer
                  >
                    <template #[`item.miktar`]>
                      {{ Number(item.miktar).toFixed(2) }}
                    </template>
                    <template #[`item.kdvharictutar`]="{ item }">
                      {{ formatToLocale(item.kdvharictutar) }}
                    </template>
                    <template #[`item.kdvtutari`]="{ item }">
                      {{ formatToLocale(item.kdvtutari) }}
                    </template>
                    <template #[`item.indirimtutari`]="{ item }">
                      {{ formatToLocale(item.indirimtutari) }}
                    </template>
                    <template #[`item.toplamtutar`]="{ item }">
                      {{ formatToLocale(item.toplamtutar) }}
                    </template>
                  </v-data-table>
                </v-sheet>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

      <v-card id="bank-receipts" class="report-section-card mb-4 mb-sm-6" elevation="2" border>
        <v-card-title class="pa-3 pa-sm-4 bg-info-lighten-5 border-b">
          <div
            class="d-flex flex-column flex-sm-row align-start align-sm-center w-100 gap-2 gap-sm-0"
          >
            <div class="d-flex align-center w-100 w-sm-auto">
              <v-avatar color="info" class="me-2 me-sm-3 responsive-avatar">
                <v-icon icon="mdi-bank" color="white" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 text-sm-h6 font-weight-bold">Banka Fiş Kalemleri</div>
                <div class="text-caption text-medium-emphasis">
                  {{ filteredBankReceipts.length }} /
                  {{ generalReport?.bankReceipts.result.length || 0 }} adet kalem
                </div>
              </div>
            </div>
            <v-spacer class="d-none d-sm-flex" />
            <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto justify-end">
              <GixTogglerMenu
                menu-activator-btn-text="Türler"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter"
                v-model:toggle-items="bankReceiptsFiltersTogglerItems"
              />

              <GixTogglerMenu
                class="ms-3"
                menu-activator-btn-text="Kolonlar"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter-variant"
                v-model:toggle-items="bankReceiptsDataTableHeaders"
              />

              <v-btn
                :prepend-icon="!xs.value ? 'mdi-chart-bar' : undefined"
                :icon="xs.value ? 'mdi-chart-bar' : undefined"
                variant="text"
                rounded="lg"
                class="ms-3 text-none"
                :text="!xs.value ? 'Tür Bazlı Grafik' : undefined"
                :append-icon="showBankReceiptsChart ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                border
                :size="xs.value ? 'small' : undefined"
                @click="showBankReceiptsChart = !showBankReceiptsChart"
              />
            </div>
          </div>
        </v-card-title>

        <v-expand-transition v-show="showBankReceiptsChart">
          <div>
            <div :class="mobile.value ? 'd-flex flex-column' : 'd-flex'">
              <GixChart
                title="Alacak"
                seriesName="Alacak"
                :seriesData="bankReceiptsChartData.credit.seriesData"
                :data-formatter="formatToLocale"
                currency="TL"
                height="55vh"
                :width="mobile.value ? '100%' : '50%'"
              />
              <GixChart
                title="Borç"
                seriesName="Borç"
                :seriesData="bankReceiptsChartData.debt.seriesData"
                :data-formatter="formatToLocale"
                currency="TL"
                height="55vh"
                :width="mobile.value ? '100%' : '50%'"
              />
            </div>
          </div>
        </v-expand-transition>
        <v-data-table
          :items="filteredBankReceipts"
          class="rounded-b-lg"
          no-data-text="Fiş bulunamadı."
          items-per-page-text="Sayfa başı fiş"
          :mobile="mobile.value"
          fixed-header
          :headers="includedBankReceiptsDataTableHeaders"
          hover
        >
          <template #[`item.alacak`]="{ item }">
            {{ formatToLocale(item.alacak) }}
          </template>
          <template #[`item.borc`]="{ item }">
            {{ formatToLocale(item.borc) }}
          </template>
        </v-data-table>
      </v-card>

      <v-card
        id="credit-card-collections"
        class="report-section-card mb-4 mb-sm-6"
        elevation="2"
        border
      >
        <v-card-title class="pa-3 pa-sm-4 bg-warning-lighten-5 border-b">
          <div
            class="d-flex flex-column flex-sm-row align-start align-sm-center w-100 gap-2 gap-sm-0"
          >
            <div class="d-flex align-center w-100 w-sm-auto">
              <v-avatar color="warning" class="me-2 me-sm-3 responsive-avatar">
                <v-icon icon="mdi-credit-card" color="white" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 text-sm-h6 font-weight-bold">
                  Kredi Kartı Tahsilatları
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ generalReport.creditCardCollections.result?.length || 0 }} adet tahsilat
                </div>
              </div>
            </div>
            <v-spacer class="d-none d-sm-flex" />
            <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto justify-end">
              <GixTogglerMenu
                menu-activator-btn-text="Kolonlar"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter-variant"
                v-model:toggle-items="creditCardCollectionsDataTableHeaders"
              />
            </div>
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
            {{ formatToLocale(item.toplamtutar) }}
          </template>
        </v-data-table>
      </v-card>

      <v-card id="material-receipts" class="report-section-card mb-4 mb-sm-6" elevation="2" border>
        <v-card-title class="pa-3 pa-sm-4 bg-secondary-lighten-5 border-b">
          <div
            class="d-flex flex-column flex-sm-row align-start align-sm-center w-100 gap-2 gap-sm-0"
          >
            <div class="d-flex align-center w-100 w-sm-auto">
              <v-avatar color="secondary" class="me-2 me-sm-3 responsive-avatar">
                <v-icon icon="mdi-package-variant" color="white" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 text-sm-h6 font-weight-bold">Malzeme Fişleri</div>
                <div class="text-caption text-medium-emphasis">
                  {{ filteredMaterialReceipts.length }} /
                  {{ generalReportUniques.materialReceipts?.length || 0 }} adet malzeme fişi
                </div>
              </div>
            </div>
            <v-spacer class="d-none d-sm-flex" />
            <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto justify-end">
              <GixTogglerMenu
                menu-activator-btn-text="Türler"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter"
                v-model:toggle-items="materialReceiptsFiltersTogglerItems"
              />

              <GixTogglerMenu
                class="ms-3"
                menu-activator-btn-text="Kolonlar"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter-variant"
                v-model:toggle-items="materialReceiptsDataTableHeaders"
              />

              <v-btn
                :prepend-icon="!xs.value ? 'mdi-chart-bar' : undefined"
                :icon="xs.value ? 'mdi-chart-bar' : undefined"
                variant="text"
                rounded="lg"
                class="ms-3 text-none"
                :text="!xs.value ? 'Tür Bazlı Grafik' : undefined"
                :append-icon="showMaterialReceiptsChart ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                border
                :size="xs.value ? 'small' : undefined"
                @click="showMaterialReceiptsChart = !showMaterialReceiptsChart"
              />
            </div>
          </div>
        </v-card-title>

        <v-expand-transition v-show="showMaterialReceiptsChart">
          <GixChart
            :legendData="materialReceiptsChartData.legendData"
            seriesName="Toplam Tutar"
            :seriesData="materialReceiptsChartData.seriesData"
            :data-formatter="formatToLocale"
            currency="TL"
            height="55vh"
          />
        </v-expand-transition>

        <v-data-table
          :items="filteredMaterialReceipts"
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
              formatToLocale(
                materialReceiptItemsByFisno
                  .get(fisno)
                  ?.reduce((sum, m) => sum + Number(m.toplam), 0) ?? 0,
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
                    :items="materialReceiptItemsByFisno.get(item.fisno)"
                    hide-default-footer
                  >
                    <template #[`item.miktar`]="{ item }">
                      {{ Number(item.miktar).toFixed(2) }}
                    </template>
                    <template #[`item.toplam`]="{ item }">
                      {{ formatToLocale(item.toplam) }}
                    </template>
                  </v-data-table>
                </v-sheet>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

      <v-card id="check-entries" class="report-section-card mb-4 mb-sm-6" elevation="2" border>
        <v-card-title class="pa-3 pa-sm-4 border-b">
          <div
            class="d-flex flex-column flex-sm-row align-start align-sm-center w-100 gap-2 gap-sm-0"
          >
            <div class="d-flex align-center w-100 w-sm-auto">
              <v-avatar color="purple" class="me-2 me-sm-3 responsive-avatar">
                <v-icon icon="mdi-checkbook" color="white" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 text-sm-h6 font-weight-bold">Çek Girişleri</div>
                <div class="text-caption text-medium-emphasis">
                  {{ generalReport.checkEntries.result?.length || 0 }} adet çek girişi
                </div>
              </div>
            </div>
            <v-spacer class="d-none d-sm-flex" />
            <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto justify-end">
              <GixTogglerMenu
                menu-activator-btn-text="Kolonlar"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter-variant"
                v-model:toggle-items="checkEntriesDataTableHeaders"
              />
            </div>
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
            {{ formatToLocale(item.tutar) }}
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

      <v-card id="cash-accounts" class="report-section-card mb-4 mb-sm-6" elevation="2" border>
        <v-card-title class="pa-3 pa-sm-4 border-b">
          <div
            class="d-flex flex-column flex-sm-row align-start align-sm-center w-100 gap-2 gap-sm-0"
          >
            <div class="d-flex align-center w-100 w-sm-auto">
              <v-avatar color="green-darken-1" class="me-2 me-sm-3 responsive-avatar">
                <v-icon icon="mdi-cash" color="white" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 text-sm-h6 font-weight-bold">Kasa Kartları</div>
                <div class="text-caption text-medium-emphasis">
                  {{ generalReport.cashAccounts.result?.length || 0 }} adet kasa kartı
                </div>
              </div>
            </div>
            <v-spacer class="d-none d-sm-flex" />

            <div class="d-flex flex-wrap gap-2 w-100 w-sm-auto justify-end">
              <GixTogglerMenu
                menu-activator-btn-text="Kolonlar"
                menu-activator-btn-class="rounded-lg border"
                menu-activator-btn-icon="mdi-filter-variant"
                v-model:toggle-items="cashAccountsDataTableHeaders"
              />

              <v-btn
                :text="!xs.value ? 'Kasa Bakiye Grafiği' : undefined"
                :prepend-icon="!xs.value ? 'mdi-chart-bar' : undefined"
                :icon="xs.value ? 'mdi-chart-bar' : undefined"
                rounded="lg"
                class="ms-3 text-none"
                :append-icon="showCashAccountChart ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                border
                :size="xs.value ? 'small' : undefined"
                @click="showCashAccountChart = !showCashAccountChart"
              />
            </div>
          </div>
        </v-card-title>

        <v-expand-transition v-show="showCashAccountChart">
          <GixChart
            :legendData="cashAccountChartData.legendData"
            seriesName="Bakiye"
            :seriesData="cashAccountChartData.seriesData"
            :data-formatter="formatToLocale"
            currency="TL"
            height="50vh"
          />
        </v-expand-transition>

        <v-data-table
          :items="generalReport.cashAccounts.result"
          class="rounded-b-lg"
          no-data-text="Kasa kartı bulunamadı."
          items-per-page-text="Sayfa başı kasa kartı"
          :mobile="mobile.value"
          fixed-header
          :headers="includedCashAccountsDataTableHeaders"
          show-expand
          item-value="_key"
          hover
        >
          <template #[`item.bakiye`]="{ item }">
            {{ formatToLocale(item.bakiye) }}
          </template>
          <template #[`item.borc`]="{ item }">
            {{ formatToLocale(item.borc) }}
          </template>
          <template #[`item.alacak`]="{ item }">
            {{ formatToLocale(item.alacak) }}
          </template>

          <template #[`item.data-table-expand`]="{ internalItem, isExpanded, toggleExpand }">
            <v-btn
              :append-icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              text="Hareketler"
              rounded="lg"
              class="text-none"
              color="medium-emphasis"
              size="small"
              variant="text"
              width="105"
              border
              slim
              @click="
                loadCashAccountMovements(internalItem.raw._key);
                toggleExpand(internalItem);
              "
            />
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-2">
                <v-sheet rounded="lg" border>
                  <v-data-table
                    :mobile="mobile.value"
                    :headers="cashAccountMovementsDataTableHeaders"
                    :items="getCashAccountMovementItems(item._key)"
                    no-data-text="Hareket bulunamadı."
                    :loading="cashAccountMovementsLoadingStates[item._key]"
                    loading-text="Hareketler yükleniyor..."
                    hide-default-footer
                  >
                    <template #top>
                      <v-card elevation="2" rounded="lg" class="rounded-b-0">
                        <v-card-title class="pa-3 pa-sm-4 border-b">
                          <div
                            class="d-flex align-center justify-space-between w-100 gap-2"
                            style="flex-wrap: nowrap"
                          >
                            <v-avatar
                              color="teal-lighten-1"
                              class="responsive-avatar flex-shrink-0"
                            >
                              <v-icon icon="mdi-swap-horizontal" color="white" />
                            </v-avatar>
                            <v-spacer />
                            <v-btn
                              :prepend-icon="!xs.value ? 'mdi-chart-bar' : undefined"
                              :icon="xs.value ? 'mdi-chart-bar' : undefined"
                              :text="!xs.value ? 'Tür Bazlı Grafik' : undefined"
                              rounded="lg"
                              border
                              :size="xs.value ? 'small' : undefined"
                              class="text-none flex-shrink-0"
                              @click="toggleCashAccountMovementsGraph(item._key)"
                              :append-icon="
                                isCashAccountMovementsGraphOpen(item._key)
                                  ? 'mdi-chevron-up'
                                  : 'mdi-chevron-down'
                              "
                            />
                          </div>
                        </v-card-title>
                        <v-expand-transition v-show="isCashAccountMovementsGraphOpen(item._key)">
                          <GixBarChart
                            :axis-data="getCashAccountMovementsChartData(item._key).axisData"
                            :bar-series-data="
                              getCashAccountMovementsChartData(item._key).barSeriesData
                            "
                            :data-formatter="formatToLocale"
                            currency="TL"
                            :index-axis="xs.value ? 'x' : 'y'"
                          />
                        </v-expand-transition>
                      </v-card>
                    </template>
                    <template #[`item.alacak`]="{ item }">
                      {{ formatToLocale(item.alacak) }}
                    </template>
                    <template #[`item.borc`]="{ item }">
                      {{ formatToLocale(item.borc) }}
                    </template>
                    <template #[`item.bakiye`]="{ item }">
                      {{ formatToLocale(item.bakiye) }}
                    </template>
                  </v-data-table>
                </v-sheet>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

      <v-card
        id="account-cards"
        class="summary-card mb-4 mb-sm-6"
        elevation="3"
        rounded="xl"
        border
      >
        <v-card-text class="pa-4 pa-sm-6 pa-md-8 pa-lg-10">
          <div class="d-flex align-center mb-4">
            <v-avatar color="info" class="me-3 me-sm-4 summary-avatar">
              <v-icon icon="mdi-account" color="white" class="summary-icon" />
            </v-avatar>
            <div>
              <div class="text-h6 text-sm-h5 text-md-h4 font-weight-bold">Cari Kartları</div>
              <div class="text-caption text-medium-emphasis">Alacaklı ve borçlu hesaplar özeti</div>
            </div>
          </div>

          <v-divider class="mb-4" />

          <div class="py-2">
            <div
              class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center mb-4 gap-2"
            >
              <div>
                <div class="text-subtitle-1 text-sm-h6 text-md-h5 font-weight-medium">
                  Alacaklı Toplamı
                </div>
              </div>
              <div class="text-left text-sm-right w-100 w-sm-auto">
                <div class="text-h6 text-sm-h5 text-md-h4 font-weight-bold text-success">
                  {{ formatToLocale(generalReport.accountCardsCreditorSum) }} TL
                </div>
                <div class="text-caption text-medium-emphasis">Alacak bakiyesi</div>
              </div>
            </div>

            <div
              class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center gap-2"
            >
              <div>
                <div class="text-subtitle-1 text-sm-h6 text-md-h5 font-weight-medium">
                  Borçlu Toplamı
                </div>
              </div>
              <div class="text-left text-sm-right w-100 w-sm-auto">
                <div class="text-h6 text-sm-h5 text-md-h4 font-weight-bold text-error">
                  {{ formatToLocale(generalReport.accountCardsDebtorSum) }} TL
                </div>
                <div class="text-caption text-medium-emphasis">Borç bakiyesi</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card
        id="purchased-services-invoices"
        class="summary-card mb-4 mb-sm-6"
        elevation="3"
        rounded="xl"
        border
      >
        <v-card-text class="pa-4 pa-sm-6 pa-md-8 pa-lg-10">
          <div class="d-flex align-center mb-4">
            <v-avatar color="warning" class="me-3 me-sm-4 summary-avatar">
              <v-icon icon="mdi-invoice-text" color="white" class="summary-icon" />
            </v-avatar>
            <div>
              <div class="text-h6 text-sm-h5 text-md-h4 font-weight-bold">Alınan Hizmetler</div>
              <div class="text-caption text-medium-emphasis">Hizmet faturaları özeti</div>
            </div>
          </div>

          <v-divider class="mb-4" />

          <div class="py-2">
            <div
              class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center gap-2"
            >
              <div>
                <div class="text-subtitle-1 text-sm-h6 text-md-h5 font-weight-medium">
                  Tutar Toplamı
                </div>
              </div>
              <div class="text-left text-sm-right w-100 w-sm-auto">
                <div class="text-h6 text-sm-h5 text-md-h4 font-weight-bold text-warning">
                  {{ formatToLocale(generalReport.purchasedServicesInvoicesSum) }} TL
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

/* Responsive avatars */
.responsive-avatar {
  width: 32px;
  height: 32px;
}

@media screen and (min-width: 600px) {
  .responsive-avatar {
    width: 40px;
    height: 40px;
  }
}

.summary-avatar {
  width: 40px;
  height: 40px;
}

@media screen and (min-width: 600px) {
  .summary-avatar {
    width: 48px;
    height: 48px;
  }
}

.summary-icon {
  font-size: 20px;
}

@media screen and (min-width: 600px) {
  .summary-icon {
    font-size: 24px;
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
