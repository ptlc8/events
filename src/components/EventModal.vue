<template>
  <Transition name="modal">
    <div class="container" v-if="show" @click.self="close">
      <div class="modal">
        <div class="banner" :style="'background-image: url(\'' + event.images[0] + '\');'"></div>
        <img class="close" src="@/assets/icons/cross.svg" @click="close">
        <div class="body">
          <span class="title">{{ event.title }}</span>
          📍 {{ event.placename }}
          <div class="categories">
            <span v-for="cat in event.categories">{{ $text.get(cat) }}</span>
          </div>
          <div class="description">{{ event.description }}</div>
          <div class="sidebar">
            <!--<h3>📅 Quand ?</h3>-->
            <div v-if="event.start.substring(0, 10) != event.end.substring(0, 10)" class="datetimes">
              <AgendaPage :datetime="event.start" />
              <AgendaPage :datetime="event.end" />
            </div>
            <AgendaPage v-else :datetime="event.start"></AgendaPage>
            <span>
              {{ $text.get('from') }} {{ $text.getDisplayTime(event.start) }}
              {{ $text.get('to') }} {{ $text.getDisplayTime(event.end) }}
            </span>
            <hr />
            <h3>🌡️ {{ $text.get('weather') }}</h3>
            <Weather :datetime="event.start" :lat="event.lat" :lng="event.lng"></Weather>
            <hr />
            <button class="show-on-map" @click="showOnMap">📍 {{ $text.get('showonmap') }}</button>
            <button class="add-fav" @click="addToFavorites">⭐ {{ $text.get('addtofav') }}</button>
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
          </div>
          <div class="images">
            <img v-for="img in event.images" :src="img">
          </div>
          <div class="footer">Ça a l'air chouette, non ?! 🦉</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import AgendaPage from "./AgendaPage.vue";
import Weather from "./Weather.vue";
export default {
  name: "EventModal",
  props: {
    show: {
      type: Boolean,
      required: true
    },
    event: {
      type: [Object, null],
      required: true
    }
  },
  emits: ['close'],
  components: { AgendaPage, Weather },
  methods: {
    close() {
      this.$emit("close");
    },
    share() {
      navigator.share({
        title: this.event.title,
        text: "Regarde cet évent, il a l'air intéressant !",
        url: this.url
      });
    },
    copy(event) {
      navigator.clipboard.writeText(this.url).then(() => {
        event.target.innerText = this.$text.get("copied");
      }).catch(err => {
        event.target.innerText = err;
      });
      setTimeout(() => event.target.innerText = "", 2000);
    },
    canShare() {
      return navigator.share;
    },
    addToFavorites() {
      console.log("TODO");
    },
    showOnMap() {
      //this.close();
      this.$router.push({ name: "map", query: { show: this.event.id } });
    }
  },
  computed: {
    url() {
      return document.location.origin + import.meta.env.VITE_BASE_URL + '?e=' + this.event.id;
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
  width: 48em;
  height: 48em;
  max-height: 100%;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
  overflow: auto;

  .close {
    position: absolute;
    top: 1em;
    right: 1em;
    width: 1.5em;
    height: 1.5em;
    z-index: 100;
    cursor: pointer;
  }
}

.banner {
  width: 100%;
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  height: 18em;
  background: center / cover;
}

.body {
  position: absolute;
  top: 16em;
  width: 100%;
  background-color: white;
  border-radius: 0.5em;
  padding: 1em 4em;
  margin: auto;

  @media (max-width: 800px) {
    padding: 1em;
  }

  .title {
    font-size: 1.8em;
    font-weight: bold;
    display: block;
    margin-left: 1em;
    line-height: 1;
    margin-bottom: .5em;
  }

  .categories span {
    border: 1px solid var(--color-border);
    border-radius: .25em;
    margin-right: .25em;
    padding: 0 .25em;
  }

  .description {
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
      display: block;
      border-radius: .5em;
      margin: 5px 0;
    }

    button {
      color: black;
      height: auto;
      width: 100%;

      &.add-fav {
        background-color: #ffff88;
      }

      &.show-on-map {
        background-color: #88ff88;
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
        border-radius: .2em;

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
      }
    }
  }

  .images {
    float: left;
    width: calc(100% - 8em);
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;

    img {
      flex: 1;
      width: 14em;
      margin: .5em;
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
  .modal {
    height: 100%;

    .close {
      position: fixed;
    }
  }

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