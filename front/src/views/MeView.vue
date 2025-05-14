<template>
  <section>
    <MessageBox v-if="!$store.logged" :message="$t.not_logged_in" :button="$t.login"
      @click="$store.login" />
    <article v-else>
      <img class="avatar" width="200" height="200" :src="$store.user.avatar" />
      <h2>{{ $store.user.name }}</h2>
      <button class="logout" @click="logout">{{ $t.logout }}</button>
    </article>
  </section>
  <section>
    <article class="button" v-if="canInstallWebApp" @click="promptInstallWebApp()">
      <h2>📱 {{ $t.install_app }}</h2>
    </article>
    <article class="button" @click="$router.push({ name: 'fav' })">
      <h2>⭐ {{ $t.fav }}</h2>
    </article>
    <article class="button" @click="$router.push({ name: 'orga' })">
      <h2>📝 {{ $t.orga }}</h2>
    </article>
    <article>
      <h2>{{ $t.language }}</h2>
      <select @change="$texts.setLang($event.target.value, true).then($forceUpdate)">
        <option v-for="lang in $texts.getAvailableLangs()" :value="lang" :selected="lang === $texts.getSavedLang()">{{
          getLangName(lang) }}</option>
        <option value="" :selected="!$texts.getSavedLang()">🌐 {{ $t.navigator_language }}</option>
      </select>
    </article>
    <article class="button" @click="$store.showAbout = true">
      <h2>📖 {{ $t.about }}</h2>
    </article>
  </section>
</template>

<script>
import MessageBox from '@/components/MessageBox.vue';
import { canInstallWebApp, promptInstallWebApp } from '@/pwa';

export default {
  name: 'MeView',
  components: { MessageBox },
  setup: () => ({
    canInstallWebApp,
    promptInstallWebApp
  }),
  methods: {
    logout() {
      this.$api.logout();
      this.$store.setLoggedUser(null);
    },
    getLangName(code) {
      var country = code.match(/[^-]+$/)[0];
      var lang = code.match(/[^-]+/)[0];
      return country.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
        + ' ' + lang;
    }
  }
}
</script>

<style lang="scss" scoped>
article {
  width: 100%;
  max-width: 1000px;
  margin-top: 10px;

  &.button {
    flex-direction: row;
    cursor: pointer;
    @include interactive;

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