import DateFnsAdapter from '@date-io/date-fns';
import '@mdi/font/css/materialdesignicons.css';
import { tr } from 'date-fns/locale/tr';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import 'vuetify/styles';

const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

export default createVuetify({
  date: {
    adapter: new DateFnsAdapter({ locale: tr }),
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: storedTheme ?? 'system',
    themes: {
      dark: {
        colors: {
          background: '#1b2119',
          surface: '#0e150e',
          'surface-dim': '#0e150e',
          'surface-bright': '#343b32',
          'on-surface': '#dde5d8',
          outline: '#879483',
          'outline-variant': '#3e4a3c',
          primary: '#66df6e',
          'on-primary': '#00390c',
          secondary: '#92d78e',
          'on-secondary': '#00390c',
          tertiary: '#b1ceab',
          'on-tertiary': '#1e361d',
          error: '#ffb4ab',
          'on-error': '#690005',
          'surface-light': '#343b32',
        },
        dark: true,
        variables: {
          'overlay-background': '#131e12',
        },
      },
      light: {
        colors: {
          background: '#f4f9f2',
          surface: '#ffffff',
          'surface-dim': '#e8ede6',
          'surface-bright': '#ffffff',
          'on-surface': '#1b2119',
          outline: '#6d7a69',
          'outline-variant': '#c2cdbf',
          primary: '#2e7d32',
          'on-primary': '#ffffff',
          secondary: '#4a6847',
          'on-secondary': '#ffffff',
          tertiary: '#3d6239',
          'on-tertiary': '#ffffff',
          error: '#ba1a1a',
          'on-error': '#ffffff',
          'surface-light': '#e8ede6',
        },
        dark: false,
        variables: {
          'overlay-background': '#f0f5ee',
        },
      },
    },
  },
});
