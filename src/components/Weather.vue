<template>
  <div v-if="weather">
    <WeatherIcon :night="isNight" :sky="interpretation.sky" :clouds="interpretation.clouds" :rain="interpretation.rain"
      :snow="interpretation.snow" :stroke="interpretation.stroke" :hail="interpretation.hail" :fog="interpretation.fog"
      :title="description">
    </WeatherIcon>
    <span class="temperature">{{ temperature }}°C</span>
  </div>
  <span class="description">{{ $text.get(description) }}</span>
</template>

<script>
import WeatherIcon from './WeatherIcon.vue';

// WMO weather interpretation codes
const interpretations = {
  0: { name: "clear-sky", sky: true },
  1: { name: "mainly-clear", clouds: 1, sky: true },
  2: { name: "partly-cloudy", clouds: 2, sky: true },
  3: { name: "overcast", clouds: 3 },
  45: { name: "fog", fog: true },
  48: { name: "depositing-rime-fog", fog: true },
  51: { name: "light-drizzle", rain: 1, fog: true },
  53: { name: "moderate-drizzle", rain: 1, fog: true },
  55: { name: "dense-drizzle", rain: 1, fog: true },
  56: { name: "light-freezing-drizzle", },
  57: { name: "dense freezing-drizzle", },
  61: { name: "slight-rain", clouds: 2, rain: 1 },
  63: { name: "moderate-rain", clouds: 2, rain: 2 },
  65: { name: "heavy-rain", clouds: 2, rain: 3 },
  66: { name: "light-freezing rain", clouds: 2, rain: 1, snow: 1 },
  67: { name: "heavy-freezing rain", clouds: 2, rain: 2, snow: 2 },
  71: { name: "slight-snowfall", clouds: 2, snow: 1 },
  73: { name: "moderate-snowfall", clouds: 2, snow: 2 },
  75: { name: "heavy-snowfall", clouds: 2, snow: 3 },
  77: { name: "snow-grains", clouds: 2, snow: 3, hail: true },
  80: { name: "slight-rain-showers", clouds: 2, rain: 1, sky: true },
  81: { name: "moderate-rain-showers", clouds: 2, rain: 2, sky: true },
  82: { name: "violent-rain-showers", clouds: 2, rain: 3, sky: true },
  85: { name: "slight-snow-showers", clouds: 2, snow: 1, sky: true },
  86: { name: "heavy-snow-showers", clouds: 2, snow: 3, sky: true },
  95: { name: "thunderstorm", clouds: 2, stroke: true },
  96: { name: "thunderstorm-with-slight-hail", clouds: 2, stroke: true, hail: true },
  99: { name: "thunderstorm-with-heavy-hail", clouds: 2, stroke: true, hail: true }
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
  data() {
    return {
      weather: null
    };
  },
  mounted() {
    this.fetchWeather();
  },
  methods: {
    async fetchWeather() {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=1&start_date=${this.date}&end_date=${this.date}`);
      this.weather = await response.json();
      if (this.weather.error) {
        console.error("[Weather] " + this.weather.reason);
        this.weather = null;
      }
    }
  },
  computed: {
    weatherCode() {
      return this.weather ? this.weather.daily.weathercode[0] : null;
    },
    interpretation() {
      return interpretations[this.weatherCode] ?? {};
    },
    description() {
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
    temperature() {
      return this.weather ? this.weather.daily.temperature_2m_min[0] : "";
    }
  },
  components: { WeatherIcon }
};
</script>

<style scoped>
div {
  display: flex;
  align-items: center;
  justify-content: center;
}

svg {
  width: 50%;
}

.description {
  display: block;
  text-align: center;
  font-size: 0.9em;
}
</style>