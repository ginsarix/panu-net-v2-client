import { MotionPlugin } from '@vueuse/motion';
import { createApp } from 'vue';

import vuetify from '@/plugins/vuetify';

import App from './App.vue';
import './assets/base.css';
import { pinia } from './plugins/pinia';
import router from './router';

const app = createApp(App);

app.use(pinia);
app.use(router);

app.use(vuetify);
app.use(MotionPlugin);

app.mount('#app');
