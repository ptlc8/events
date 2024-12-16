<template>
    <div class="fields">
        <SearchBar v-model="search.text" :placeholder="$text.get('searchevents')" />
        <IntervalSelect class="dateselect" type="date" v-model="search.date" :options="defaultDateOptions"
            @change="onChange" />
        <IntervalSelect class="timeselect" type="time" v-model="search.time" :options="defaultTimeOptions"
            @change="onChange" />
        <select class="sort-select" v-model="search.sort" @change="onChange">
            <option value="datetime">{{ $text.get('sortbydate') }}</option>
            <option value="relevance" :disabled="!geolocation">{{ $text.get('sortbyrelevance') }}</option>
            <option value="popularity">{{ $text.get('sortbypopularity') }}</option>
            <option value="distance" :disabled="!geolocation">{{ $text.get('sortbydistance') }}</option>
        </select>
        <GeolocationInput class="geolocation-input" v-model="search.gloc" :placeholder="gloc?.name"
            @change="onChange" />
        <DistanceInput v-if="geolocation" class="distance-input" v-model="search.dist" @change="onChange" />
        <MultiSelect class="catselect" :title="$text.get('categories')" v-model="search.cats" @change="onChange"
            :options="categories.reduce((acc, c) => (acc[c.id] = $text.get(c.id)) && acc, {})" />
    </div>
</template>

<script>
import EventsApi from '@/api';
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
    data() {
        return {
            search: {},
            categories: [],
            gloc: null
        };
    },
    mounted() {
        this.search = this.modelValue;
        EventsApi.getCategories().then(cats => this.categories = cats);
        this.$geolocation.get().then(gloc => this.gloc = gloc);
    },
    watch: {
        modelValue(value) {
            this.search = value;
        }
    },
    methods: {
        onChange() {
            this.$emit('update:modelValue', this.search);
        }
    },
    computed: {
        defaultDateOptions() {
            return [
                { min: formatRelativeDate(0), max: null, label: this.$text.get("fromtoday") },
                { min: null, max: null, label: this.$text.get("alldate") },
                { min: formatRelativeDate(0), max: formatRelativeDate(1), label: this.$text.get("today") },
                { min: formatRelativeDate(1), max: formatRelativeDate(2), label: this.$text.get("tomorrow") },
                { min: formatRelativeDate(0), max: formatRelativeDate(7), label: this.$text.get("week") },
                { min: formatRelativeDate(0), max: formatRelativeDate(30), label: this.$text.get("month") }
            ];
        },
        defaultTimeOptions() {
            return [
                { min: null, max: null, label: this.$text.get('alltime') },
                { min: formatRelativeTime(-3), max: formatRelativeTime(3), label: this.$text.get('now') },
                { min: '00:00', max: '06:00', label: this.$text.get('night') },
                { min: '06:00', max: '12:00', label: this.$text.get('morning') },
                { min: '12:00', max: '18:00', label: this.$text.get('afternoon') },
                { min: '18:00', max: '00:00', label: this.$text.get('evening') }
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
