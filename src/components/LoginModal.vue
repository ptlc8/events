<template>
  <Transition name="modal">
    <div class="container" v-if="show" @click.self="close">
      <div class="modal">
        <img class="close" src="@/assets/cross.svg" @click="close">
        <form @submit.prevent="submit">
          <span class="title">Connexion</span>
          <input v-model="username" placeholder="Nom d'utilisateur" autofocus="true" autocomplete="username">
          <input v-model="password" placeholder="Mot de passe" type="password" autocomplete="current-password">
          <button>{{ Texts.get("login") }}</button>
          <span class="info">{{ info }}</span>
          <a v-if="info" href="/forgotten-password" target="_blank">J'ai oublié mon mot de passe</a>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script>
import EventsApi from '@/api';
import Texts from '@/texts.js';
export default {
  name: "LoginModal",
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  setup() {
    return {
      Texts,
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
  emits: ['close'],
  methods: {
    close() {
      this.$emit("close");
    },
    submit() {
      EventsApi.login(this.username, this.password)
        .then(() => {
          this.password = "";
          this.$store.login(this.username);
          this.$emit("close");
        })
        .catch(err => {
          this.info = Texts.get(err);
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 0.5em;
  padding: 1em 2em;
  width: 32em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
}

.close {
  position: absolute;
  top: 1em;
  right: 1em;
  width: 1.5em;
  height: 1.5em;
  cursor: pointer;
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