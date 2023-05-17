<template>
  <section>
    <div class="fields">
      <div class="searchbar">
        <img src="@/assets/icons/search-icon.svg">
        <input type="text" id="searchtext" :placeholder="$text.get('searchevents')" @keypress="search" @paste="search"
          @input="search" v-model="searchtext">
      </div>
      <IntervalSelect class="dateselect" type="date" :min="searchDate.min" :max="searchDate.max"
        @change="date => (searchDate = date) && search()" :options="defaultDateOptions" />
      <IntervalSelect class="timeselect" type="time" :min="searchTime.min" :max="searchTime.max"
        @change="time => (searchTime = time) && search()" :options="defaultTimeOptions" />
      <select class="sort-select" v-model="searchSort" @change="search">
        <option value="datetime">{{ $text.get('sortbydate') }}</option>
        <option value="relevance">{{ $text.get('sortbyrelevance') }}</option>
        <option value="popularity">{{ $text.get('sortbypopularity') }}</option>
        <option value="distance">{{ $text.get('sortbydistance') }}</option>
      </select>
      <GeolocationInput class="geolocation-input" v-model="searchLocation" :placeholder="defaultLocationName"
        @change="search" />
      <DistanceInput class="distance-input" v-model="searchDistance" @input="search" />
      <MultiSelect class="catselect" :title="$text.get('categories')" @change="cats => (searchcats = cats) && search()"
        :options="EventsApi.getCategories().reduce((acc, c) => (acc[c] = $text.get(c)) && acc, {})" />
    </div>
    <div id="results">
      <EventPreview class="event" v-for="event in events" :event="event" @click="$store.event = event"></EventPreview>
    </div>
    <MessageBox v-if="!events.length" :message="$text.get('noresults')" :button="$text.get('organizeit')"
      @click="$router.push('/orga')"></MessageBox>
    <button v-else-if="canSearchMore" class="more-button" @click="searchMore()">Afficher plus d'évents</button>
  </section>
</template>

<script>
import MultiSelect from '../components/inputs/MultiSelect.vue';
import IntervalSelect from '../components/inputs/IntervalSelect.vue';
import EventPreview from '../components/EventPreview.vue';
import EventsApi from '../api';
import MessageBox from '../components/MessageBox.vue';
import GeolocationInput from '../components/inputs/GeolocationInput.vue';
import DistanceInput from '../components/inputs/DistanceInput.vue';
export default {
  name: 'SearchView',
  components: {
    MultiSelect,
    IntervalSelect,
    EventPreview,
    MessageBox,
    GeolocationInput,
    DistanceInput
},
  setup() {
    return { EventsApi };
  },
  mounted() {
    this.search();
    EventsApi.getLocation().then(loc => {
      fetch(`https://api.mapbox.com/search/searchbox/v1/reverse?longitude=${loc[0]}&latitude=${loc[1]}&access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`)
        .then(res => res.json())
        .then(res => {
          this.defaultLocationName = res.features[0].properties.place_formatted;
        });
      this.searchLocation = {
        name: '',
        lon: loc[0],
        lat: loc[1]
      };
    });
  },
  data() {
    return {
      events: [],
      searchtext: '',
      searchDate: { min: this.formatRelativeDate(0), max: null },
      searchTime: { min: null, max: null },
      searchcats: [],
      searchLocation: null,
      searchDistance: null,
      searchSort: 'relevance',
      searchId: 0,
      canSearchMore: false,
      defaultLocationName: ''
    };
  },
  methods: {
    search() {
      let searchId = ++this.searchId;
      setTimeout(() => {
        if (searchId != this.searchId) return;
        EventsApi.getEvents({
          text: this.searchtext,
          datemin: this.searchDate.min,
          datemax: this.searchDate.max,
          timemin: this.searchTime.min,
          timemax: this.searchTime.max,
          cats: this.searchcats,
          lon: this.searchLocation?.lon,
          lat: this.searchLocation?.lat,
          distance: this.searchDistance,
          sort: this.searchSort,
          timezoneoffset: new Date().getTimezoneOffset(),
          limit: 50
        }).then(events => {
          this.events = events;
          this.canSearchMore = events.length == 50;
        });
      }, 500);
    },
    searchMore() {
      EventsApi.getEvents({
        text: this.searchtext,
        datemin: this.searchDate.min,
        datemax: this.searchDate.max,
        timemin: this.searchTime.min,
        timemax: this.searchTime.max,
        cats: this.searchcats,
        sort: this.searchSort,
        timezoneoffset: new Date().getTimezoneOffset(),
        limit: 50,
        offset: this.events.length
      }).then(events => {
        this.events = this.events.concat(events);
        this.canSearchMore = events.length == 50;
      });
    },
    formatRelativeDate(days = 0) {
      return new Date(Date.now() + (days * 24 * 60 - new Date().getTimezoneOffset()) * 60 * 1000).toISOString().split('T')[0];
    },
    formatRelativeTime(hours = 0) {
      return new Date(Date.now() + (hours * 60 - new Date().getTimezoneOffset()) * 60 * 1000).toISOString().substring(11, 19);
    }
  },
  computed: {
    defaultDateOptions() {
      return [
        { min: this.formatRelativeDate(0), max: null, label: this.$text.get("fromtoday") },
        { min: null, max: null, label: this.$text.get("alldate") },
        { min: this.formatRelativeDate(0), max: this.formatRelativeDate(1), label: this.$text.get("today") },
        { min: this.formatRelativeDate(1), max: this.formatRelativeDate(2), label: this.$text.get("tomorrow") },
        { min: this.formatRelativeDate(0), max: this.formatRelativeDate(7), label: this.$text.get("week") },
        { min: this.formatRelativeDate(0), max: this.formatRelativeDate(30), label: this.$text.get("month") }
      ];
    },
    defaultTimeOptions() {
      return [
        { min: null, max: null, label: this.$text.get('alltime') },
        { min: this.formatRelativeTime(-3), max: this.formatRelativeTime(3), label: this.$text.get('now') },
        { min: '00:00', max: '06:00', label: this.$text.get('night') },
        { min: '06:00', max: '12:00', label: this.$text.get('morning') },
        { min: '12:00', max: '18:00', label: this.$text.get('afternoon') },
        { min: '18:00', max: '00:00', label: this.$text.get('evening') }
      ];
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
.timeselect,
.sort-select,
.geolocation-input {
  flex-grow: 10;
  width: 24em;
  min-width: 30%;
  margin-top: 0;
}

.catselect {
  min-width: 50%;
  width: 24em;
  flex-grow: 10;
}

.distance-input {
  width: 8em;
  min-width: 15%;
  flex-grow: 1;
}

#results {
  width: 90%;
  margin: 2em auto;
  display: flex;
  flex-wrap: wrap;
  gap: .5em;

  >* {
    width: 32em;
    flex-grow: 1;
  }
}

.more-button {
  display: block;
  margin: 1em auto;
}
</style>
