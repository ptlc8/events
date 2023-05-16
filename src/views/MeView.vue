<template>
  <section>
    <h1>👤 {{ $text.get('me') }}</h1>
    <MessageBox v-if="!$store.logged" :message="$text.get('notloggedin')" :button="$text.get('login')"
      @click="$store.login" />
    <article v-else>
      <img class="avatar" width="200" height="200" src="https://source.unsplash.com/200x200/?user" />
      <h2>{{ $store.username }}</h2>
      <button class="logout" @click="logout">{{ $text.get('logout') }}</button>
    </article>
    <article class="button" @click="$router.push({name:'fav'})">
      <h2>⭐ {{ $text.get('fav') }}</h2>
    </article>
    <article class="button" @click="$router.push({name:'orga'})">
      <h2>📝 {{ $text.get('orga') }}</h2>
    </article>
    <article>
      <h2>{{ $text.get('language') }}</h2>
      <select @change="$text.setLang($event.target.value, true).then($forceUpdate)">
        <option v-for="lang in $text.getAvailableLangs()" :value="lang" :selected="lang === $text.getLang()">{{
          getLangName(lang) }}</option>
      </select>
    </article>
  </section>
</template>

<script>
import EventsApi from '../api';
import MessageBox from '../components/MessageBox.vue';

export default {
  name: 'MeView',
  components: { MessageBox },
  setup() {
    return { EventsApi };
  },
  methods: {
    logout() {
      EventsApi.logout();
      this.$store.setLoggedUser(null);
    },
    getLangName(code) {
      //return code.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
      return code.match(/[^-]+$/)[0].toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
        + ' ' + code.match(/[^-]+/)[0];
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

  &.button {
    display: flex;
    flex-direction: row;
    cursor: pointer;

    >* {
      flex: 1;
      text-align: center;
    }

    &::after {
      content: '🞂';
      content: 'ᐳ';
      justify-self: flex-end;
      margin-right: 8px;
    }
  }

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