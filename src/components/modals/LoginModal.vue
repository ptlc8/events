<template>
  <Modal v-bind="$attrs" ref="modal" class="login-modal">
    <form @submit.prevent="submit">
      <span class="title">Connexion</span>
      <input v-model="username" placeholder="Nom d'utilisateur" autofocus="true" autocomplete="username">
      <input v-model="password" placeholder="Mot de passe" type="password" autocomplete="current-password">
      <button>{{ $text.get("login") }}</button>
      <span class="info">{{ info }}</span>
      <a v-if="info" href="/forgotten-password" target="_blank">J'ai oublié mon mot de passe</a>
    </form>
  </Modal>
</template>

<script>
import EventsApi from '@/api';
import Modal from './Modal.vue';
export default {
  name: "LoginModal",
  components: { Modal },
  setup() {
    return {
      EventsApi
    };
  },
  data() {
    return {
      username: "",
      password: "",
      info: ""
    };
  },
  methods: {
    submit() {
      EventsApi.login(this.username, this.password)
        .then(() => {
          this.password = "";
          this.$store.setLoggedUser(this.username);
          this.$refs.modal.close();
        })
        .catch(err => {
          this.info = this.$text.get(err);
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.login-modal {
  .modal {

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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
}
</style>