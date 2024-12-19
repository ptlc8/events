<template>
    <div class="list">
        <div class="results">
            <EventPreview class="event" v-for="event in events" :event="event" @click="$store.event = event" />
        </div>
        <MessageBox v-if="!events.length" :message="$text.get('noresults')" :button="$text.get('organizeit')"
            @click="$router.push('/orga')" />
        <button v-else-if="canSearchMore" class="more-button" @click="launchSearch(true)">Afficher plus d'évents</button>
    </div>
</template>

<script>
import EventPreview from './EventPreview.vue';
import MessageBox from './MessageBox.vue';

export default {
    name: 'EventsList',
    components: {
        EventPreview,
        MessageBox
    },
    props: {
        search: {
            type: Object,
            required: true
        }
    },
    data: () => ({
        gloc: null,
        events: [],
        searchId: 0,
        canSearchMore: false
    }),
    mounted() {
        this.$geolocation.get().then(gloc => this.gloc = gloc);
        this.launchSearch();
    },
    watch: {
        search: {
            handler() {
                let searchId = ++this.searchId;
                setTimeout(() => {
                    if (searchId != this.searchId) return;
                    this.launchSearch();
                }, 500);
            },
            deep: true
        }
    },
    methods: {
        launchSearch(more = false) {
            if (!this.search)
                return;
            this.$api.getEvents({
                text: this.search.text,
                datemin: this.search.date.min,
                datemax: this.search.date.max,
                timemin: this.search.time.min,
                timemax: this.search.time.max,
                cats: this.search.cats,
                lng: this.search.gloc?.lng ?? this.gloc?.lng,
                lat: this.search.gloc?.lat ?? this.gloc?.lat,
                distance: this.search.gloc || this.gloc ? this.search.dist : undefined,
                sort: !this.search.gloc && !this.gloc && ['relevance', 'distance'].includes(this.search.sort) ? undefined : this.search.sort,
                timezoneoffset: new Date().getTimezoneOffset(),
                limit: 50,
                offset: more ? this.events.length : null
            }).then(events => {
                this.events = more ? this.events.concat(events) : events;
                this.canSearchMore = events.length == 50;
            });
        }
    }
}
</script>

<style lang="scss" scoped>
.list {
    flex: 1;
    width: 90%;
    margin: 0 auto;

    .results {
        display: flex;
        flex-wrap: wrap;
        gap: .5em;
        margin: 1em 0;

        .event {
            width: 32em;
            flex-grow: 1;
        }
    }

    .more-button {
        display: block;
        margin: 1em auto;
    }
}
</style>
