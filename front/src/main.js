import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import createRouter from './router';
import { useMainStore } from './stores/main';
import { useGeolocationStore } from './stores/geolocation';
import Api from './api';
import Texts from './texts';
import './pwa';

import './assets/main.scss';

(async () => {

  const app = createApp(App);

  const store = createPinia();
  app.use(store);
  app.config.globalProperties.$store = useMainStore();
  app.config.globalProperties.$geolocation = useGeolocationStore();
  app.config.globalProperties.$api = Api;

  await Texts.init(["fr-FR", "en-GB", "en-US"]);
  app.config.globalProperties.$texts = Texts;
  app.config.globalProperties.$t = Texts.values;

  app.use(await createRouter());

  app.mount('#app');
  
})();