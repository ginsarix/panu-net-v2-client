import { format } from 'date-fns';

export const formatDateTime = (date: string | Date, formatStr?: string) => {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  if (parsedDate.toString() === 'Invalid Date') return parsedDate;

  return format(parsedDate, formatStr || 'dd.MM.yyyy HH:mm:ss');
};
