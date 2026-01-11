<template>
  <Modal v-bind="$attrs" ref="modal">
    <span class="title">{{ $t.login }}</span>
    <!--<form @submit.prevent="login">
      <input v-model="username" placeholder="Nom d'utilisateur" autofocus="true" autocomplete="username">
      <input v-model="password" placeholder="Mot de passe" type="password" autocomplete="current-password">
      <button>{{ $t.login }}</button>
      <a v-if="info" href="/forgotten-password" target="_blank">J'ai oublié mon mot de passe</a>
    </form>-->
    <button class="login-with-link" @click="loginWith">
      <img src="https://ambi.dev/favicon.ico" />
      {{ $t.login_with }} Ambi.dev
    </button>
    <span class="info">{{ info }}</span>
  </Modal>
</template>

<script>
import Modal from './Modal.vue';

export default {
  name: "LoginModal",
  components: { Modal },
  data() {
    return {
      username: "",
      password: "",
      info: ""
    };
  },
  mounted() {
    window.addEventListener("message", this.receiveMessage);
  },
  beforeUnmount() {
    window.removeEventListener("message", this.receiveMessage);
  },
  methods: {
    login() {
      this.$api.login(this.username, this.password)
        .then(user => {
          this.password = "";
          this.$store.setLoggedUser(user);
          this.$refs.modal.close();
        })
        .catch(err => {
          this.info = this.$t[err];
        });
    },
    loginWith() {
      this.$api.getLoginWithUrl().then(url => {
        window.open(url, "_blank");
      });
    },
    receiveMessage(event) {
      if (typeof event.data === "object" && event.data.target === "events") {
        if (event.data.loggedin) {
          this.$store.setLoggedUser(event.data.user);
          this.$refs.modal.close();
        } else {
          this.info = this.$t.logging_in_failed;
        }
        event.source.close();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.login-with-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5em;
  color: #fff;
  font-size: 1.5em;
  background-color: #82b;

  img {
    height: 2em;
  }
}

.title {
  font-size: 1.5em;
  font-weight: bold;
  display: block;
  text-align: center;
}

input {
  width: 100%;
}

button {
  width: 100%;
  margin-bottom: 0.5em;
}

.info {
  display: block;
  color: red;
  text-align: center;
}
</style>