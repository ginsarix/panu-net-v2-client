export interface RadioProperties {
  id: string;
  label: string;
  value: string;
}

export interface SelectProperties {
  title: string;
  value: number;
}

export interface InputProperties {
  id: string;
  type:
    | 'text'
    | 'number'
    | 'tel'
    | 'email'
    | 'password'
    | 'date'
    | 'checkbox'
    | 'url'
    | 'search'
    | 'radio'
    | 'select';
  label: string;
  hidden?: boolean;
  icon?: string;
  hint?: string;
  showPassword?: boolean;
  counter?: number;
  value: string;
  radios?: RadioProperties[];
  selectItems?: SelectProperties[];
  validationRules?: ((v: string) => true | string)[];
  neverResetValue?: boolean;
}
