import { defineStore } from 'pinia';
import { watch } from 'vue';

export const useMainStore = defineStore('main', {
  state: () => ({
    user: null,
    loggingIn: false,
    event: null,
    showAbout: false
  }),
  getters: {
    logged: state => state.user != null
  },
  actions: {
    setLoggedUser(user) {
      this.user = user;
    },
    login() {
      return new Promise((resolve, reject) => {
        if (this.logged) return resolve();
        this.loggingIn = true;
        watch(() => this.loggingIn, () => {
          if (this.logged) resolve();
          else reject("aborted by user");
        });
      });
    }
  }
});