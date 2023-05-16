<script>
import { RouterLink, RouterView } from 'vue-router';
import { watch } from 'vue';
import LoginModal from '@/components/modals/LoginModal.vue';
import EventModal from '@/components/modals/EventModal.vue';
import EventsApi from '@/api';

import orgaIcon from '@/assets/icons/orga.svg';
import searchIcon from '@/assets/icons/search.svg';
import mapIcon from '@/assets/icons/map.svg';
import favIcon from '@/assets/icons/fav.svg';
import meIcon from '@/assets/icons/me.svg';

export default {
  components: {
    LoginModal,
    EventModal
  },
  setup() {
    return { RouterLink, RouterView, EventsApi };
  },
  data() {
    return {
      tabs: [
        { name: 'orga', icon: orgaIcon },
        { name: 'search', icon: searchIcon },
        { name: 'map', icon: mapIcon },
        { name: 'fav', icon: favIcon },
        { name: 'me', icon: meIcon }
      ]
    };
  },
  mounted() {
    // on router init
    var unwatchRoute = watch(() => this.$route, () => {
      if (this.$route.query.e) {
        EventsApi.getEvent(this.$route.query.e).then(event => {
          this.$store.event = event;
        });
      }
      unwatchRoute();
    });

    watch(() => this.$store.event, () => {
      this.$router.replace({ name: this.$route.name, query: { ...this.$route.query, e: this.$store.event?.id } });
    });

    EventsApi.getSelfUser().then(user => {
      this.$store.setLoggedUser(user?.username);
    });
  }
}
</script>

<template>
  <main>
    <RouterView />
  </main>

  <nav>
    <RouterLink v-for="tab in tabs" :to="{ name: tab.name }" :style="`background-image: url('${tab.icon}');`">
      {{ $text.get(tab.name) }}
    </RouterLink>
  </nav>

  <EventModal :show="$store.event != null" :event="$store.event" @close="$store.event = null" />
  <LoginModal :show="$store.loggingIn" @close="$store.endLoggingIn" />
</template>

<style lang="scss" scoped>
main {
  flex: 10;
  overflow: auto;
}

nav {
  flex: 1;
  display: flex;

  a {
    flex: 3;
    display: flex;
    border: 1px solid var(--color-border);
    background: white center .5em / auto calc(100% - 2em) no-repeat radial-gradient(#e6fbff, white);
    align-items: end;
    justify-content: center;
    color: var(--color-text);


    &:hover:not(.router-link-exact-active) {
      background-size: auto calc(100% - 1.5em);
    }

    &.router-link-exact-active {
      flex: 4;
    }
  }
}

@media (min-width: 1024px) {}
</style>
