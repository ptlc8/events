<script>
import { RouterLink, RouterView } from 'vue-router';
import { watch, ref } from 'vue';
import LoginModal from '@/components/modals/LoginModal.vue';
import EventModal from '@/components/modals/EventModal.vue';
import AboutModal from '@/components/modals/AboutModal.vue';

const tabs = ref({});

for (const tab of ['search', 'categories', 'map', 'me']) {
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
  <main>
    <RouterView />
  </main>

  <nav>
    <RouterLink v-for="tab in tabs" :to="{ name: tab.name }" :style="`background-image: url('${tab.icon}');`">
      {{ $text.get(tab.name) }}
    </RouterLink>
  </nav>

  <EventModal :show="$store.event != null" :event="$store.event" @close="$store.event = null" />
  <LoginModal :show="$store.loggingIn" @close="$store.loggingIn = false" />
  <AboutModal :show="$store.showAbout" @close="$store.showAbout = false" />
</template>

<style lang="scss" scoped>
nav {
  flex: 1;
  display: flex;

  a {
    flex: 3;
    display: flex;
    border: 1px solid var(--color-border);
    background: var(--color-background) center .5em / auto calc(100% - 2em) no-repeat;
    align-items: end;
    justify-content: center;
    color: var(--color-text);

    &:hover:not(.router-link-exact-active) {
      background-size: auto calc(100% - 1.5em);
      color: var(--color-heading);
    }

    &.router-link-exact-active {
      flex: 4;
      color: var(--color-heading);
    }
  }
}

@media (min-width: 1024px) {}
</style>
