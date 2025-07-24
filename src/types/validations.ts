export const noEmptyRule = (v: string) => !!v || 'Boş bırakılamaz';
export const noEmptyArrayRule = (v: unknown[]) => v.length > 0 || 'Boş olamaz.';
export const emailRule = (v: string) =>
  /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(v) ||
  'Geçerli bir e-posta adresi giriniz';
export const passwordRule = (v: string) => v.length >= 8 || 'Şifre en az 8 karakter olmalıdır';
export const phoneRule = (v: string) => {
  const strippedV = v.replace(/\D/g, '');
  return /^\d{10}$/.test(strippedV) || !v || 'Telefon numarası 10 haneli olmalıdır';
};

export const emailRules = [noEmptyRule, emailRule];
export const passwordRules = [noEmptyRule, passwordRule];
export const phoneRules = [phoneRule];
