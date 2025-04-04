<template>
    <div class="fields">
        <SearchBar v-model="search.text" :placeholder="$t.search_events" />
        <IntervalSelect class="dateselect" type="date" v-model="search.date" :options="defaultDateOptions" />
        <IntervalSelect class="timeselect" type="time" v-model="search.time" :options="defaultTimeOptions" />
        <select class="sort-select" v-model="search.sort">
            <option value="datetime">{{ $t.sort_by_date }}</option>
            <option value="relevance" :disabled="!geolocation">{{ $t.sort_by_relevance }}</option>
            <option value="popularity">{{ $t.sort_by_popularity }}</option>
            <option value="distance" :disabled="!geolocation">{{ $t.sort_by_distance }}</option>
        </select>
        <GeolocationInput class="geolocation-input" v-model="search.gloc" :placeholder="gloc?.name" />
        <DistanceInput v-if="geolocation" class="distance-input" v-model="search.dist" />
        <MultiSelect class="catselect" :title="$t.categories" v-model="search.cats"
            :options="categories.reduce((acc, c) => (acc[c.id] = c.emoji + ' ' + $t[c.id]) && acc, {})" />
    </div>
</template>

<script>
import SearchBar from './inputs/SearchBar.vue';
import MultiSelect from './inputs/MultiSelect.vue';
import IntervalSelect from './inputs/IntervalSelect.vue';
import EventPreview from './EventPreview.vue';
import GeolocationInput from './inputs/GeolocationInput.vue';
import DistanceInput from './inputs/DistanceInput.vue';

export function formatRelativeDate(days = 0) {
    return new Date(Date.now() + (days * 24 * 60 - new Date().getTimezoneOffset()) * 60 * 1000).toISOString().split('T')[0];
}
function formatRelativeTime(hours = 0) {
    return new Date(Date.now() + (hours * 60 - new Date().getTimezoneOffset()) * 60 * 1000).toISOString().substring(11, 19);
}

export default {
    name: 'SearchInputs',
    components: {
        SearchBar,
        MultiSelect,
        IntervalSelect,
        EventPreview,
        GeolocationInput,
        DistanceInput
    },
    props: {
        modelValue: Object
    },
    emits: ['update:modelValue'],
    data() {
        return {
            search: {},
            categories: [],
            gloc: null
        };
    },
    mounted() {
        this.search = this.modelValue;
        this.$api.getCategories().then(cats => this.categories = cats);
        this.$geolocation.get().then(gloc => this.gloc = gloc);
    },
    watch: {
        modelValue: {
            handler(value) {
                this.search = value;
            },
            deep: true
        }
    },
    computed: {
        defaultDateOptions() {
            return [
                { min: formatRelativeDate(0), max: null, label: this.$t.from_today },
                { min: null, max: null, label: this.$t.all_date },
                { min: formatRelativeDate(0), max: formatRelativeDate(1), label: this.$t.today },
                { min: formatRelativeDate(1), max: formatRelativeDate(2), label: this.$t.tomorrow },
                { min: formatRelativeDate(0), max: formatRelativeDate(7), label: this.$t.week },
                { min: formatRelativeDate(0), max: formatRelativeDate(30), label: this.$t.month }
            ];
        },
        defaultTimeOptions() {
            return [
                { min: null, max: null, label: this.$t.all_time },
                { min: formatRelativeTime(-3), max: formatRelativeTime(3), label: this.$t.now },
                { min: '00:00', max: '06:00', label: this.$t.night },
                { min: '06:00', max: '12:00', label: this.$t.morning },
                { min: '12:00', max: '18:00', label: this.$t.afternoon },
                { min: '18:00', max: '00:00', label: this.$t.evening }
            ];
        },
        geolocation() {
            return this.gloc || this.search.gloc;
        }
    }
}
</script>

<style lang="scss" scoped>
.fields {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
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
</style>
