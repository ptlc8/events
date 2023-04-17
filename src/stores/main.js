import { defineStore } from 'pinia';

export const useMainStore = defineStore('main', {
  state: () => ({
    username: null,
    loggingIn: false,
    event: null
  }),
  getters: {
    logged: state => state.username != null
  },
  actions: {
    login(username) {
      this.username = username;
    },
    logout() {
      this.username = null;
    }
  }
});