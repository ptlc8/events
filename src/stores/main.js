import { defineStore } from 'pinia';
import { watch } from 'vue';

export const useMainStore = defineStore('main', {
  state: () => ({
    username: null,
    loggingIn: false,
    event: null,
    events: []
  }),
  getters: {
    logged: state => state.username != null
  },
  actions: {
    setLoggedUser(username) {
      this.username = username;
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
    },
    endLoggingIn() {
      this.loggingIn = false;
    }
  }
});