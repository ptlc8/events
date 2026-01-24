<template>
  <Modal big v-bind="$attrs">
    <div :class="{ banner: true, loading }" :style="'background-image: url(\'' + banner?.url + '\');'" :title="banner?.credits"></div>
    <div class="body">
      <h2 :class="{ title: true, loading }">{{ event?.title }}</h2>
      <div :class="{ author: true, loading }">👤 {{ event?.author }}</div>
      <div :class="{ place: true, loading }">📍 {{ event?.placename }}</div>
      <div class="categories">
        <span v-for="cat in categories">{{ cat.emoji }} {{ $t[cat.id] }}</span>
      </div>
      <div :class="{ description: true, loading }" v-html="marked.parse(event?.description)"></div>
      <div class="sidebar">
        <h3>📅 Quand ?</h3>
        <div v-if="event?.start?.substring(0, 10) != event?.end?.substring(0, 10)" class="datetimes">
          <AgendaPage :datetime="event.start" />
          <AgendaPage :datetime="event.end" />
        </div>
        <AgendaPage v-else :class="{ loading }" :datetime="event?.start" />
        <span v-if="event">
          {{ $t.from }} {{ $texts.getDisplayTime(event.start) }}
          {{ $t.to }} {{ $texts.getDisplayTime(event.end) }}
        </span>
        <hr />
        <h3>🌡️ {{ $t.weather }}</h3>
        <Weather :datetime="event?.start" :lat="event?.lat" :lng="event?.lng" />
        <hr />
        <div v-if="event?.contact?.length > 0">
          <h3>📞 {{ $t.contact }}</h3>
          <Contacts :contacts="event.contact" />
          <hr />
        </div>
        <div v-if="event?.registration?.length > 0">
          <h3>📝 {{ $t.registration }}</h3>
          <Contacts :contacts="event.registration" />
          <hr />
        </div>
        <button :disabled="!event" class="show-on-map" @click="showOnMap">📍 {{ $t.show_on_map }}</button>
        <button :disabled="!event" v-if="isApp" class="open-map" @click="openMapApp">🗺️ {{ $t.open_map_app }}</button>
        <button :disabled="!event" class="add-fav" @click="switchFavorite">⭐ {{ event?.fav ? $t.remove_fav : $t.add_fav }}</button>
        <template v-if="event">
          <button v-if="canShare()" class="large-share-button" @click="share()">🚀 Partager</button>
          <div v-else class="share-buttons">
            <a class="tumblr" target="_blank" title="Partager sur Tumblr"
              :href="`https://www.tumblr.com/share/link?url=${encodeURIComponent(url)}&title=${encodeURIComponent(event.title)}&title=${encodeURIComponent(event.title)}`"></a>
            <a class="email" target="_blank" title="Envoyer par email"
              :href="`mailto:?Subject=${encodeURIComponent(event.title)}&Body=${encodeURIComponent('Regarde cet évent, il a l\'air intéréssant : ' + url)}`"></a>
            <a class="facebook" target="_blank" title="Partager sur Facebook"
              :href="`https://www.facebook.com/sharer.php?u=${encodeURIComponent(url)}`"></a>
            <a class="twitter" target="_blank" title="Partager sur Twitter"
              :href="`https://twitter.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(event.title)}&hashtags=events`"></a>
            <a class="whatsapp" target="_blank" title="Partager sur WhatsApp"
              :href="`https://api.whatsapp.com/send?text=${encodeURIComponent(event.title + ' : ' + url)}`"></a>
            <a class="messenger" target="_blank" title="Partager sur Messenger"
              :href="`fb-messenger://share/?link=${encodeURIComponent(url)}`"></a>
            <a class="telegram" target="_blank" title="Partager sur Telegram"
              :href="`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(event.title)}`"></a>
            <button class="copy-button" @click="copy"></button>
          </div>
        </template>
      </div>
      <div class="images">
        <figure v-for="(img, i) in event?.images">
          <img :src="img">
          <figcaption>{{ getImageCredits(i) }}</figcaption>
        </figure>
      </div>
      <div class="footer">{{ $t.whimsical_signoff }}</div>
    </div>
  </Modal>
</template>

<script>
import { marked } from "marked";
import AgendaPage from "@/components/AgendaPage.vue";
import Weather from "@/components/Weather.vue";
import Contacts from "@/components/Contacts.vue";
import { origin, backendUrl, isApp } from "@/config";
import Modal from "./Modal.vue";

export default {
  name: "EventModal",
  props: {
    event: {
      type: [Object, null],
      required: true
    }
  },
  components: { AgendaPage, Weather, Contacts, Modal },
  setup: () => ({
    isApp,
    marked
  }),
  data: () => ({
    allCategories: []
  }),
  mounted() {
    this.$api.getCategories()
      .then(categories => this.allCategories = categories);
  },
  methods: {
    share() {
      navigator.share({
        title: this.event.title,
        text: "Regarde cet évent, il a l'air intéressant !",
        url: this.url
      });
    },
    copy(event) {
      navigator.clipboard.writeText(this.url).then(() => {
        event.target.innerText = this.$t.copied;
      }).catch(err => {
        event.target.innerText = err;
      });
      setTimeout(() => event.target.innerText = "", 2000);
    },
    canShare() {
      return navigator.share;
    },
    switchFavorite() {
      if (this.event.fav) {
        this.$api.removeFavorite(this.event.id)
          .then(() => this.event.fav = false)
          .catch(() => { });
      } else {
        this.$store.login()
          .then(() => this.$api.addFavorite(this.event.id)
            .then(() => this.event.fav = true)
          ).catch(() => { });
      }
    },
    showOnMap() {
      if (this.$route.name == "search")
        this.$router.replace({ ...this.$route, query: { ...this.$route.query, map: null, show: this.event.id, e: undefined } });
      else
        this.$router.push({ name: "search", query: { map: null, show: this.event.id } });
    },
    openMapApp() {
      window.open(`geo:${this.event.lat},${this.event.lng}?q=${this.event.placename}`);
    },
    getImageCredits(i) {
      return this.event?.imagesCredits?.length ? this.event.imagesCredits[i % this.event.imagesCredits.length] : "";
    }
  },
  computed: {
    loading() {
      return this.event === undefined;
    },
    url() {
      return origin + '?e=' + this.event.id;
    },
    banner() {
      if (!this.event?.images) return null;
      let nonRepresentative = !!this.event.nonRepresentativeImage;
      return {
        url: nonRepresentative ? backendUrl + this.event.nonRepresentativeImage : this.event.images[0],
        credits: nonRepresentative ? this.$t.non_representative : this.event.imagesCredits?.[0],
        nonRepresentative
      };
    },
    categories() {
      if (!this.event?.categories || !this.allCategories.length)
        return [];
      return this.event.categories.map(id => this.allCategories.find(c => c.id === id));
    }
  }
};
</script>

<style lang="scss" scoped>
.banner {
  width: 100%;
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  height: 18em;
  background-position: center;
  background-size: cover;
  @include image;
}

.body {
  position: absolute;
  top: 16em;
  width: 100%;
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 1em 4em;
  margin: auto;

  @media (max-width: 800px) {
    padding: 1em;
  }

  .title {
    display: block;
    margin-left: 1em;
    margin-bottom: .2em;
    font-size: 1.8em;
    font-weight: bold;
    line-height: 1;
  }

  .author, .place {
    margin-left: .5em;
    margin-bottom: .5em;
  }

  .categories span {
    border: 1px solid var(--color-border);
    border-radius: 4px;
    margin-right: .25em;
    padding: 0 .25em;
  }

  .description {
    min-height: 8em;
    font-size: 1.2em;
    line-height: 1.5;
    width: calc(100% - 8em);
    text-align: justify;
    border-top: 1px solid var(--color-border);
    padding-top: .5em;
    margin-top: .5em;
    float: left;
    white-space: pre-wrap;
  }

  .datetimes>* {
    display: inline-block;
    font-size: .5em;
  }

  .sidebar {
    float: right;
    width: 8em;
    display: flex;
    flex-direction: column;

    >* {
      margin: 5px 0;
    }

    button {
      color: black;
      height: auto;
      width: 100%;
      @include image;

      &.add-fav {
        background-color: #ffff88;
      }

      &.show-on-map {
        background-color: #88ff88;
      }

      &.open-map {
        background-color: #fbbf88
      }

      &.large-share-button {
        background-color: #88bbff;
      }
    }

    .share-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: .2em;

      a {
        background: no-repeat center/cover;
        width: 100%;
        padding-top: 100%;
        border-radius: 8px;
        @include image;

        @each $social in facebook twitter whatsapp email tumblr messenger telegram /*reddit linkedin line viber skype wechat*/ {
          &.#{$social} {
            background-image: url("@/assets/icons/socials/#{$social}.svg");
          }
        }
      }

      .copy-button {
        grid-column: 1 / -1;
        width: 100%;
        height: 2.5em;
        margin: 0;
        padding: 0;
        background: no-repeat center/contain skyblue url(@/assets/icons/copy.svg);
        //background-color: transparent;
        text-align: center;
        font-weight: bold;
        color: black;
        @include image;
      }
    }
  }

  .images {
    float: left;
    width: calc(100% - 8em);
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;

    figure {
      flex: 1;

      img {
        display: block;
        width: 14em;
        min-width: calc(100% - 1em);
        margin: .5em .5em 0 .5em;
      }

      figcaption {
        font-size: .8em;
        text-align: center;
        color: gray;
        font-style: italic;
      }
    }
  }

  .footer {
    clear: both;
    text-align: center;
    border-top: 1px solid var(--color-border);
    padding-top: .5em;
    margin-top: .5em;
  }
}



@media (max-width: 800px) {
  .body {

    .description,
    .images {
      width: 100%
    }

    .sidebar {
      float: unset;
      width: 100%;

      .share-buttons {
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
      }
    }
  }
}
</style>