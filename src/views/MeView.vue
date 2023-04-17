<template>
  <section>
    <h1>👤 {{ Texts.get('me') }}</h1>
    <MessageBox v-if="!$store.logged" :message="Texts.get('notloggedin')" :button="Texts.get('login')"
      @click="$store.loggingIn = true" />
    <article v-else>
      <img class="avatar" width="200" height="200" src="https://source.unsplash.com/200x200/?user" />
      <h2>{{ $store.username }}</h2>
      <button class="logout" @click="logout">{{ Texts.get('logout') }}</button>
    </article>
  </section>
</template>

<script>
import Texts from '../texts';
import EventsApi from '../api';
import MessageBox from '../components/MessageBox.vue';

export default {
  name: 'MeView',
  components: { MessageBox },
  setup() {
    return { Texts, EventsApi };
  },
  methods: {
    logout() {
      EventsApi.logout();
      this.$store.logout();
    }
  }
}
</script>

<style lang="scss" scoped>
article {
  max-width: 1000px;
  margin: 10px auto 0;
  box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .avatar {
    display: block;
    margin: auto;
    border-radius: 100%;
  }
  .logout {
    background-color: #ff6961;
  }
}
</style>