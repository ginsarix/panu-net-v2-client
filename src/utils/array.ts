export function duplicatesBy<T, K extends keyof T>(array: T[], key: K): T[] {
  const counts = new Map<unknown, number>();

  for (const item of array) {
    const val = item[key];
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }

  return array.filter((item) => {
    const val = item[key];
    return (counts.get(val) ?? 0) > 1;
  });
}

export function uniqueBy<T, K extends keyof T>(array: T[], prop: K): T[] {
  const seen = new Set<T[K]>();
  return array.filter((item) => {
    const value = item[prop];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}
