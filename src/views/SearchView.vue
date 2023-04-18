<template>
  <section>
    <div class="fields">
      <div class="searchbar">
        <img src="@/assets/icons/search-icon.svg">
        <input type="text" id="searchtext" :placeholder="$text.get('searchevents')" @keypress="search" @paste="search" @input="search" v-model="searchtext">
      </div>
      <select class="dateselect" v-model="searchdate" @change="search">
        <option v-for="value in ['alldate', 'today', 'tomorrow', 'week', 'nextweek', 'month']" :value="value">
          {{ $text.get(value) }}
        </option>
      </select>
      <select class="timeselect" v-model="searchtime" @change="search">
        <option v-for="value in ['alltime', 'now', 'morning', 'afternoon', 'evening', 'night']" :value="value">
          {{ $text.get(value) }}
        </option>
      </select>
      <MultiSelect class="catselect" :title="$text.get('categories')" @change="cats => (searchcats = cats) && search()"
        :options="EventsApi.getCategories().reduce((acc, c) => (acc[c] = $text.get(c)) && acc, {})" />
    </div>
    <div id="results">
      <EventPreview class="event" v-for="event in events" :event="event" @click="$store.event = event"></EventPreview>
    </div>
    <MessageBox v-if="!events.length" :message="$text.get('noresults')" :button="$text.get('organizeit')"
      @click="$router.push('/orga')"></MessageBox>
    <button v-else class="more-button" @click="searchMore()">Afficher plus d'évents</button>
  </section>
</template>

<script>
import MultiSelect from '../components/MultiSelect.vue';
import EventPreview from '../components/EventPreview.vue';
import EventsApi from '../api';
import MessageBox from '../components/MessageBox.vue';
export default {
  name: 'SearchView',
  components: {
    MultiSelect,
    EventPreview,
    MessageBox
  },
  setup() {
    return { EventsApi };
  },
  mounted() {
    this.search();
  },
  data() {
    return {
      events: [],
      searchtext: '',
      searchdate: 'alldate',
      searchtime: 'alltime',
      searchcats: [],
      lastSearchTime: 0
    };
  },
  methods: {
    search() {
      this.lastSearchTime = Date.now();
      setTimeout(() => {
        if (Date.now() - 450 < this.lastSearchTime) return;
        EventsApi.getEvents({
          text: this.searchtext,
          date: this.searchdate,
          time: this.searchtime,
          cats: this.searchcats,
          timezoneoffset: new Date().getTimezoneOffset()
        }).then(events => {
          this.events = events;
        });
      }, 500);
    },
    searchMore() {
      EventsApi.getEvents({
        text: this.searchtext,
        date: this.searchdate,
        time: this.searchtime,
        cats: this.searchcats,
        timezoneoffset: new Date().getTimezoneOffset(),
        offset: this.events.length
      }).then(events => {
        this.events = this.events.concat(events);
      });
    }
  }
}
</script>

<style lang="scss" scoped>
section {
  overflow: auto;
  min-height: 100%;
}

.fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.searchbar {
  width: 100%;
  display: block;
  background-color: #fff;
  position: relative;

  img {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 8px;
  }

  input {
    width: 100%;
    border: 0;
    background-color: transparent;
    margin: 0;
    color: #404040;
    color: rgba(0, 0, 0, 0.75);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    padding: 12px 35px;
    box-sizing: border-box;
    font: 15px / 20px "Open Sans", "Helvetica Neue", Arial, Helvetica, sans-serif;
  }
}

.dateselect,
.timeselect {
  flex-grow: 1;
  width: 12em;
  margin-top: 0;
}

.catselect {
  width: 50%;
}

#results {
  width: 90%;
  margin: 2em auto;
  display: flex;
  flex-wrap: wrap;
  gap: .5em;

  >* {
    width: 24em;
    flex-grow: 1;
  }
}

.more-button {
  display: block;
  margin: 1em auto;
}

@media (orientation: portrait) {

  .dateselect,
  .timeselect {
    min-width: 40%;
  }

  .catselect {
    width: 100%;
  }

}</style>
