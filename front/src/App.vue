<script>
import { RouterLink, RouterView } from 'vue-router';
import { watch, ref } from 'vue';
import LoginModal from '@/components/modals/LoginModal.vue';
import EventModal from '@/components/modals/EventModal.vue';
import AboutModal from '@/components/modals/AboutModal.vue';

const tabs = ref({});

for (const tab of ['home', 'map', 'search', 'me']) {
  tabs.value[tab] = { name: tab };
  import(`@/assets/icons/${tab}.svg?no-inline`)
    .then(icon => tabs.value[tab].icon = icon.default);
}

export default {
  components: {
    LoginModal,
    EventModal,
    AboutModal,
    RouterLink,
    RouterView
  },
  setup: () => ({
    tabs
  }),
  mounted(a) {
    // on router init
    var unwatchRoute = watch(() => this.$route, () => {
      if (this.$route.query.e) {
        this.$api.getEvent(this.$route.query.e).then(event => {
          this.$store.event = event;
        });
      }
      unwatchRoute();
    });

    watch(() => this.$store.event, () => {
      this.$router.replace({ name: this.$route.name, query: { ...this.$route.query, e: this.$store.event?.id } });
    });

    this.$api.getSelfUser().then(user => {
      this.$store.setLoggedUser(user);
    });
  }
}
</script>

<template>
  <header>
    <RouterLink :to="{ name: 'home' }">
      <h1>{{ $t.site_name }}</h1>
    </RouterLink>
    <h2>
      {{ $route.meta.title }} 
    </h2>
    <nav>
      <RouterLink v-for="tab in tabs" :to="{ name: tab.name }">
        <img :src="tab.icon" :alt="$t[tab.name]" :title="$t[tab.name]" />
      </RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>

  <nav>
    <RouterLink v-for="tab in tabs" :to="{ name: tab.name }">
      <img :src="tab.icon" :alt="$t[tab.name]" :title="$t[tab.name]" />
      <span>{{ $t[tab.name] }}</span>
    </RouterLink>
  </nav>

  <EventModal :show="$store.event != null" :event="$store.event" @close="$store.event = null" />
  <LoginModal :show="$store.loggingIn" @close="$store.loggingIn = false" />
  <AboutModal :show="$store.showAbout" @close="$store.showAbout = false" />
</template>

<style lang="scss" scoped>
header {
  nav {
    display: flex;
    gap: 1em;
    flex-grow: 0;

    a {
      display: flex;

      img {
        height: 2em;
      }
    }
  }
}

main {
  flex: 10;
}

main + nav {
  display: none;

  a {
    flex: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    padding: .2em;
    border: 1px solid var(--color-border);
    border-radius: 0;
    color: var(--color-text);

    img {
      height: 2em;
      transition: transform .2s ease-in-out;
    }

    &.router-link-exact-active {
      flex: 4;
      color: var(--color-heading);
    }
  }
}

@media (hover: none) {
  header {
    padding-right: 2rem;
    padding-left: 2rem;
  }
  header nav {
    display: none;
  }
  main + nav {
    display: flex;
  }
}
</style>
