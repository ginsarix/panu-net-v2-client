// group items by a label and sum a numeric value
export function buildGroupedSumChartData<T>(
  collection: { result: T[] } | T[] | undefined,
  getGroup: (item: T) => string | undefined,
  getValue: (item: T) => number | string | undefined,
  options?: { unknownLabel?: string },
) {
  const items = Array.isArray(collection) ? collection : (collection?.result ?? []);

  const unknownLabel = options?.unknownLabel ?? 'Diğer';
  const totalsByGroup = items.reduce(
    (acc, item) => {
      const rawGroup = getGroup(item);
      const group = rawGroup && String(rawGroup).trim() ? String(rawGroup) : unknownLabel;
      const value = Number(getValue(item)) || 0;

      if (value === 0) return acc;

      acc[group] = (acc[group] ?? 0) + value;
      return acc;
    },
    {} as Record<string, number>,
  );

  const legendData = Object.keys(totalsByGroup);
  const seriesData = legendData.map((name) => ({ name, value: totalsByGroup[name] }));

  return { legendData, seriesData };
}
