export const stateSelectList = [
  { value: 'open', title: 'Açık' },
  { value: 'in_process', title: 'İşleniyor' },
  { value: 'completed', title: 'Tamamlandı' },
  { value: 'reopened', title: 'Tekrar Açıldı' },
  { value: null, title: 'Hepsi' },
];

export const stateColors = {
  open: 'blue',
  in_process: 'amber',
  completed: 'green',
  reopened: 'purple',
};

export const stateDisplayTexts = {
  open: 'Açık',
  in_process: 'İşleniyor',
  completed: 'Tamamlandı',
  reopened: 'Tekrar Açıldı',
};

export const prioritySelectList = [
  { value: 'low', title: 'Düşük' },
  { value: 'medium', title: 'Orta' },
  { value: 'high', title: 'Yüksek' },
  { value: 'urgent', title: 'Acil' },
  { value: null, title: 'Hepsi' },
];

export const priorityColors = {
  low: 'grey',
  medium: 'cyan',
  high: 'orange',
  urgent: 'red',
};

export const priorityDisplayTexts = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
};
