import { format } from 'date-fns';

export const formatDateTime = (date: string | Date, formatStr?: string) => {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  if (parsedDate.toString() === 'Invalid Date') return parsedDate;

  return format(parsedDate, formatStr || 'dd.MM.yyyy HH:mm:ss');
};

export const formatCurrency = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '0';
  return Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
