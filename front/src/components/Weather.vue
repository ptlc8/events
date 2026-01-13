<template>
  <div v-if="weather" class="weather">
    <WeatherIcon :night="isNight" :sky="interpretation.sky" :clouds="interpretation.clouds" :rain="interpretation.rain"
      :snow="interpretation.snow" :stroke="interpretation.stroke" :hail="interpretation.hail" :fog="interpretation.fog"
      :title="description">
    </WeatherIcon>
    <div class="temperatures">
      <span>{{ temperature_min }}</span>
      <span>{{ temperature_max }}</span>
    </div>
  </div>
  <span :class="{description: true, loading}">{{ $t[description] }}</span>
</template>

<script>
import WeatherIcon from './WeatherIcon.vue';

// WMO weather interpretation codes
const interpretations = {
  0: { name: "clear_sky", sky: true },
  1: { name: "mainly_clear", clouds: 1, sky: true },
  2: { name: "partly_cloudy", clouds: 2, sky: true },
  3: { name: "overcast", clouds: 3 },
  45: { name: "fog", fog: true },
  48: { name: "depositing_rime_fog", fog: true },
  51: { name: "light_drizzle", rain: 1, fog: true },
  53: { name: "moderate_drizzle", rain: 1, fog: true },
  55: { name: "dense_drizzle", rain: 1, fog: true },
  56: { name: "light_freezing_drizzle", snow: 1, fog: true },
  57: { name: "dense_freezing_drizzle", snow: 1, fog: true },
  61: { name: "slight_rain", clouds: 2, rain: 1, sky: true },
  63: { name: "moderate_rain", clouds: 2, rain: 2 },
  65: { name: "heavy_rain", clouds: 2, rain: 3 },
  66: { name: "light_freezing_rain", clouds: 2, rain: 1, snow: 1, sky: true },
  67: { name: "heavy_freezing_rain", clouds: 2, rain: 2, snow: 2 },
  71: { name: "slight_snowfall", clouds: 2, snow: 1, sky: true },
  73: { name: "moderate_snowfall", clouds: 2, snow: 2 },
  75: { name: "heavy_snowfall", clouds: 2, snow: 3 },
  77: { name: "snow_grains", clouds: 2, snow: 3, hail: true },
  80: { name: "slight_rain_showers", clouds: 2, rain: 1, sky: true },
  81: { name: "moderate_rain_showers", clouds: 2, rain: 2, sky: true },
  82: { name: "violent_rain_showers", clouds: 2, rain: 3 },
  85: { name: "slight_snow_showers", clouds: 2, snow: 1, sky: true },
  86: { name: "heavy_snow_showers", clouds: 2, snow: 3 },
  95: { name: "thunderstorm", clouds: 2, stroke: true },
  96: { name: "thunderstorm_with_slight_hail", clouds: 2, stroke: true, hail: true },
  99: { name: "thunderstorm_with_heavy_hail", clouds: 2, stroke: true, hail: true }
};

export default {
  name: "Weather",
  props: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    datetime: {
      type: String,
      required: true
    }
  },
  components: { WeatherIcon },
  data() {
    return {
      weather: undefined
    };
  },
  mounted() {
    this.fetchWeather();
  },
  methods: {
    fetchWeather() {
      var limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 16);
      if (!this.datetime || limitDate < new Date(this.datetime)) {
        this.weather = null;
        return;
      }
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&start_date=${this.date}&end_date=${this.date}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error("[Weather] " + data.reason);
            this.weather = null;
          } else {
            console.log("[Weather] Fetched data:", data);
            this.weather = data;
          }
        })
        .catch(err => {
          console.error("[Weather] " + err);
          this.weather = null;
        });
    }
  },
  computed: {
    loading() {
      return this.weather === undefined;
    },
    weatherCode() {
      return this.weather ? this.weather.daily.weathercode[0] : null;
    },
    interpretation() {
      return interpretations[this.weatherCode] ?? {};
    },
    description() {
      if (this.weather === undefined)
        return;
      return this.interpretation.name ?? "unknown";
    },
    isNight() {
      if (!this.weather)
        return false;
      return new Date(this.datetime) > new Date(this.weather.daily.sunset[0]) || new Date(this.datetime) < new Date(this.weather.daily.sunrise[0]);
    },
    date() {
      return this.datetime.substring(0, 10);
    },
    temperature_min() {
      if (!this.weather) return "";
      return this.weather.daily.temperature_2m_min.reduce((a, b) => a + b, 0) / this.weather.daily.temperature_2m_min.length + this.weather.daily_units.temperature_2m_min;
    },
    temperature_max() {
      if (!this.weather) return "";
      return this.weather.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / this.weather.daily.temperature_2m_max.length + this.weather.daily_units.temperature_2m_max;
    }
  }
};
</script>

<style scoped>
.weather {
  display: flex;
  align-items: center;
  justify-content: center;

  .temperatures {
    display: flex;
    flex-direction: column;
  }
}

.description {
  display: block;
  text-align: center;
  font-size: 0.9em;
}
</style>