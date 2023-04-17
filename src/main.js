import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useMainStore } from './stores/main';

import './assets/main.scss';

const app = createApp(App);

const store = createPinia();
app.use(store);

app.config.globalProperties.$store = useMainStore();

app.use(router);

app.mount('#app');
