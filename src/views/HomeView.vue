<template>
    <h1>Évents</h1>
    <section>
        <h2>⭐ Populaires</h2>
        <div class="events-list">
            <EventPreview vertical class="event" v-for="event in popularEvents" :event="event" @click="$store.event = event" />
            <RouterLink class="more" :to="{ name: 'search', query: { s: 'popularity' } }">View more</RouterLink>
        </div>
    </section>
    <section>
        <h2>🎯 Pertinents</h2>
        <div class="events-list">
            <EventPreview vertical class="event" v-for="event in relevantEvents" :event="event" @click="$store.event = event" />
            <RouterLink class="more" :to="{ name: 'search', query: { s: 'relevance' } }">View more</RouterLink>
        </div>
    </section>
    <section>
        <h2>⏰ Bientôt</h2>
        <div class="events-list">
            <EventPreview vertical class="event" v-for="event in soonEvents" :event="event" @click="$store.event = event" />
            <RouterLink class="more" :to="{ name: 'search', query: { s: 'datetime' } }">View more</RouterLink>
        </div>
    </section>
    <section>
        <h2>📍 À proximité</h2>
        <div class="events-list">
            <EventPreview vertical class="event" v-for="event in nearEvents" :event="event" @click="$store.event = event" />
            <RouterLink class="more" :to="{ name: 'search', query: { s: 'distance' } }">View more</RouterLink>
        </div>
    </section>
</template>

<script>
import EventPreview from '@/components/EventPreview.vue';
import EventsApi from '@/api';
import { RouterLink } from 'vue-router';
export default {
    name: 'SearchView',
    setup() {
        return { EventsApi };
    },
    data() {
        return {
            nearEvents: [],
            popularEvents: [],
            relevantEvents: [],
            soonEvents: []
        };
    },
    mounted() {
        EventsApi.getLocation().then(loc => {
            EventsApi.getEvents({
                lon: loc.lon,
                lat: loc.lat,
                sort: 'distance',
                limit: 10
            }).then(events => {
                this.nearEvents = events;
            });
            EventsApi.getEvents({
                lon: loc.lon,
                lat: loc.lat,
                sort: 'relevance',
                datemin: new Date(new Date().getTimezoneOffset() * 60 * 1000).toISOString().split('T')[0],
                timemin: new Date(new Date().getTimezoneOffset() * 60 * 1000).toISOString().substring(11, 19),
                limit: 10,
                timezoneoffset: new Date().getTimezoneOffset()
            }).then(events => {
                this.relevantEvents = events;
            });
        });
        EventsApi.getEvents({
            sort: 'datetime',
            datemin: new Date(new Date().getTimezoneOffset() * 60 * 1000).toISOString().split('T')[0],
            timemin: new Date(new Date().getTimezoneOffset() * 60 * 1000).toISOString().substring(11, 19),
            limit: 10,
            timezoneoffset: new Date().getTimezoneOffset()
        }).then(events => {
            this.soonEvents = events;
        });
        EventsApi.getEvents({
            sort: 'popularity',
            limit: 10
        }).then(events => {
            this.popularEvents = events;
        });
    },
    components: { EventPreview, RouterLink }
}
</script>

<style lang="scss" scoped>
.events-list {
    display: flex;
    overflow: auto;
    scroll-snap-type: x mandatory;
    padding: 0.5em;
    gap: 1em;
    cursor: pointer;

    >* {
        flex: 0 0 20em;
        //scroll-snap-align: center;
    }

    .more {
        box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
}
</style>