<template>
  <div class="geolocation-input" @mouseenter="mouseover = true" @mouseleave="mouseover = false">
    <input type="text" v-model="query" :placeholder="placeholder"
      @focusin="focus = true" @focusout="focus = false" />
    <div v-if="opened" class="results">
      <div v-for="result in results" class="result" @click="change(result)">{{ result.name }}</div>
      <button class="result reset" @click="change(null)" tabindex="-1">✖</button>
    </div>
  </div>
</template>

<script>
import { mapboxAccessToken } from '@/config';
export default {
  name: 'GeolocationInput',
  props: {
    modelValue: {
      type: Object,
      required: false,
      default: null
    },
    placeholder: {
      type: String,
      required: false,
      default: ''
    }
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      query: '',
      results: [],
      focus: false,
      mouseover: false
    };
  },
  watch: {
    modelValue(value) {
      if (!value) {
        this.query = '';
        return;
      }
      this.query = value?.name ?? value.lng + ', ' + value.lat;
      if (!value.name) {
        this.$geolocation.getFromPos(value.lng, value.lat)
          .then(loc => this.query = loc.name);
      }
    },
    query(query) {
      this.mapboxQuery(query)
        .then(results => {
          this.results = results.features.map(f => ({
            name: f.place_name,
            lng: f.center[0],
            lat: f.center[1]
          }));
        });
    }
  },
  computed: {
    opened() {
      return this.focus || this.mouseover;
    }
  },
  methods: {
    change(value) {
      this.query = value?.name ?? '';
      this.$emit('update:modelValue', value);
      this.$emit('change');
      this.mouseover = false;
    },
    mapboxQuery(query) {
      return fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?language=${this.$text.getShortLang()}&access_token=${mapboxAccessToken}`)
        .then(res => res.json())
        .catch(err => {
          console.error('[GeolocationInput] ' + err);
          return null;
        });
    }
  }
}
</script>

<style lang="scss">
.geolocation-input {
  z-index: 50;

  input {
    width: 100%;
    height: 100%;
    margin: 0;
  }

  .results {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 0 0 4px 4px;
    border-top: solid 1px var(--color-border);
    box-shadow: 0 5px 4px 2px rgba(0, 0, 0, .1);
    user-select: none;

    .result {
      padding: 2px 1em;
      margin: 2px 0;
      border: solid 1px var(--color-border);
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background-color: var(--color-primary);
      }
    }

    .reset {
      background-color: indianred;

      &:hover {
        background-color: indianred;
      }
    }
  }
}
</style>