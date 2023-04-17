<template>
  <section>
    <div class="fields">
      <div class="searchbar">
        <img src="@/assets/icons/search-icon.svg">
        <input type="text" id="searchtext" placeholder="Rechercher des évents..." @keypress="search" @paste="search" @input="search" v-model="searchtext">
      </div>
      <select class="dateselect" v-model="searchdate" @change="search">
        <option value="alldate">Toute période</option>
        <option value="today">Aujourd'hui</option>
        <option value="tomorrow">Demain</option>
        <option value="week">Cette semaine</option>
        <option value="nextweek">La semaine prochaine</option>
        <option value="month">Ce mois-ci</option>
      </select>
      <select class="timeselect" v-model="searchtime" @change="search">
        <option value="alltime">N'importe quand</option>
        <option value="now">Maintenant</option>
        <option value="morning">Le matin</option>
        <option value="afternoon">L'après-midi</option>
        <option value="evening">En soirée</option>
        <option value="night">La nuit</option>
      </select>
      <MultiSelect class="catselect" title="Catégories" @change="cats => (searchcats = cats) && search()"
        :options="EventsApi.getCategories().reduce((acc, c) => (acc[c] = Texts.get(c)) && acc, {})" />
    </div>
    <div id="results">
      <EventPreview v-for="event in events" :event="event" @click="$store.event = event"></EventPreview>
      <MessageBox v-if="!events.length" :message="Texts.get('noresults')" :button="Texts.get('organizeit')" @click="$router.push('/orga')"></MessageBox>
      <button v-else @click="searchMore()">Afficher plus d'évents</button>
    </div>
  </section>
</template>

<script>
import MultiSelect from '../components/MultiSelect.vue';
import EventPreview from '../components/EventPreview.vue';
import EventsApi from '../api';
import Texts from '../texts';
import MessageBox from '../components/MessageBox.vue';
export default {
  name: 'SearchView',
  components: {
    MultiSelect,
    EventPreview,
    MessageBox
},
  setup() {
    return { EventsApi, Texts };
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
  flex-wrap: wrap
}

.searchbar {
  width: 100%;
  margin: 10px 0 0 10px;
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
  margin-left: 10px;
}

.catselect {
  width: 50%;
}

#results {
  width: 90%;
  margin: auto;
}

@media (orientation: portrait) {

  .dateselect,
  .timeselect {
    min-width: 40%;
  }

  .catselect {
    width: 100%;
  }

}
</style>
