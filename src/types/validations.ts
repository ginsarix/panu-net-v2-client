import { normalizeEmail } from '@/utils/formatting';

export const noEmptyRule = (v: unknown) => !!v || 'Boş bırakılamaz';
export const noEmptyArrayRule = (v: unknown[]) => v.length > 0 || 'Boş olamaz.';
export const emailRule = (v: string) =>
  /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(v) ||
  'Geçerli bir e-posta adresi giriniz';
export const passwordRule = (v: string) => v.length >= 8 || 'Şifre en az 8 karakter olmalıdır';
export const phoneRule = (v: string) => {
  const strippedV = v.replace(/\D/g, '');
  return /^\d{10}$/.test(strippedV) || !v || 'Telefon numarası 10 haneli olmalıdır';
};

const mustBeNumberMessage = 'Sayı olmalıdır';

export const nonNegativeNumberRule = (v: unknown) => {
  if (typeof v !== 'number') return mustBeNumberMessage;
  if (v < 0) return 'Pozitif sayı olmalıdır';
  return true;
};

export const integerRule = (v: unknown) => {
  if (typeof v !== 'number') return mustBeNumberMessage;
  if (!Number.isInteger(v)) return 'Tam sayı olmalıdır';
  return true;
};

const normalizedEmailRule = (v: string) => {
  if (!v) return true; // Let noEmptyRule handle empty values
  const normalized = normalizeEmail(v);
  return emailRule(normalized);
};

export const emailRules = [noEmptyRule, normalizedEmailRule];
export const passwordRules = [noEmptyRule, passwordRule];
export const phoneRules = [phoneRule];
