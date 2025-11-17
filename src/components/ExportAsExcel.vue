<script setup lang="ts">
import { type ColInfo, utils, writeFileXLSX } from '@e965/xlsx';

import { createUniqueFilename } from '@/utils/file';

const props = defineProps<{
  items: Record<string, string | number>[];
  /**
   * If not provided, the column width will be calculated automatically.
   */
  maxWidth?: number;
  headers: string[][];
  /**
   * Identifier and file extension will be added to the filename, so you don't need to add them.
   */
  filename: string;
}>();

const exportAsExcel = () => {
  const worksheet = utils.json_to_sheet(props.items, { skipHeader: true });
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, props.filename);

  utils.sheet_add_aoa(worksheet, props.headers, { origin: 'A1' });

  /* calculate column width for each column */
  const columnWidths: ColInfo[] = props.headers.map((header, colIndex) => {
    let maxWidth = String(header).length;

    // check all values in this column
    for (const item of props.items) {
      const values = Object.values(item);
      const cellValue = values[colIndex];
      const len = String(cellValue).length;
      if (len > maxWidth) maxWidth = len;
    }

    // add some padding and return
    return { wch: Math.min(maxWidth + 2, 50) }; // cap at 50 to avoid huge columns
  });

  worksheet['!cols'] = columnWidths;

  writeFileXLSX(workbook, createUniqueFilename(props.filename, 'xlsx'));
};
</script>

<template>
  <v-tooltip text="Excel olarak dışa aktar" location="left">
    <template #activator="{ props }">
      <v-btn
        v-bind="{ ...$attrs, ...props }"
        aria-label="Excel olarak dışa aktar"
        variant="text"
        icon="mdi-file-excel"
        @click="exportAsExcel"
      />
    </template>
  </v-tooltip>
</template>
