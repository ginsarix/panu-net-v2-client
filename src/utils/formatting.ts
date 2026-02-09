import { format } from 'date-fns';

export const formatDateTime = (date: string | Date, formatStr?: string) => {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  if (parsedDate.toString() === 'Invalid Date') return '';

  return format(parsedDate, formatStr || 'dd.MM.yyyy HH:mm:ss');
};

export const formatToLocale = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '0';
  return Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const cashAccountMovementTypes = {
  TAH: 'Cari Hesap Tahsilat',
  ODM: 'Cari Hesap Ödeme',
  YAT: 'Bankaya Yatırılan',
  CEK: 'Bankadan Çekilen',
  MC_PT: 'Çek Tahsili',
  MS_PT: 'Senet Tahsili',
  KC_MT: 'Çek Ödemesi',
  KS_MT: 'Senet Ödemesi',
  ACBO: 'Açılış (Borç)',
  ACAL: 'Açılış (Alacak)',
  VRBO: 'Virman (Borç)',
  VRAL: 'Virman (Alacak)',
  KFBO: 'Kur Farkı (Borç)',
  KFAL: 'Kur Farkı (Alacak)',
  HZMT: 'Gider (Hizmet) Fişi',
  GDPU: 'Gider Pusulası',
  VSMM: 'Verilen Serbest Meslek Makbuzu',
  ASMM: 'Alınan Serbest Meslek Makbuzu',
  '1': 'Mal Alım',
  '4': 'Alınan Hizmet',
  '6': 'Alım İade',
  '7': 'Perakende Satış İade',
  '8': 'Toptan Satış İade',
  '2': 'Perakende Satış',
  '3': 'Toptan Satış',
  '5': 'Verilen Hizmet',
  OTAH: 'Odadan Tahsilat',
  OODM: 'Odaya Ödeme',
  IKY: 'Kredi Kartına Yatırılan',
  IKC: 'Kredi Kartından Çekilen',
} as const;

// since the api doesnt expose the turu with description we have to map it
export const mapCashAccountMovementTypes = (type: keyof typeof cashAccountMovementTypes) => {
  return cashAccountMovementTypes[type];
};

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};
