<template>
    <section>
        <SearchBar :placeholder="$t.search_events" @click="$router.push({ name: 'search' })" />
    </section>
    <section class="categories">
        <router-link v-for="cat in categories" :to="{ name: 'search', query: { c: cat.id } }" class="categorie">
            <span class="icon">{{ cat.emoji }}</span>
            {{ $t[cat.id] }}
        </router-link>
        <router-link :to="{ name: 'categories' }" class="categorie">
            <span class="icon">...</span>
            Autres
        </router-link>
    </section>
    <section>
        <h2>🎯 {{ $t.relevant }}</h2>
        <div class="events-list">
            <EventPreview vertical class="event" v-for="event in relevantEvents" :event="event" @click="$store.event = event" />
            <RouterLink class="more" :to="{ name: 'search', query: { s: 'relevance' } }">{{ $t.view_more }}</RouterLink>
        </div>
    </section>
    <section>
        <h2>⭐ {{ $t.popular }}</h2>
        <div class="events-list">
            <EventPreview vertical class="event" v-for="event in popularEvents" :event="event" @click="$store.event = event" />
            <RouterLink class="more" :to="{ name: 'search', query: { s: 'popularity' } }">{{ $t.view_more }}</RouterLink>
        </div>
    </section>
    <section>
        <h2>📍 {{ $t.nearby }} ({{ gloc?.name }})</h2>
        <div class="events-list">
            <EventPreview vertical class="event" v-for="event in nearbyEvents" :event="event" @click="$store.event = event" />
            <RouterLink class="more" :to="{ name: 'search', query: { s: 'distance' } }">{{ $t.view_more }}</RouterLink>
        </div>
    </section>
    <section>
        <h2>⏰ {{ $t.soon }}</h2>
        <div class="events-list">
            <EventPreview vertical class="event" v-for="event in soonEvents" :event="event" @click="$store.event = event" />
            <RouterLink class="more" :to="{ name: 'search', query: { s: 'datetime' } }">{{ $t.view_more }}</RouterLink>
        </div>
    </section>
</template>

<script>
import EventPreview from '@/components/EventPreview.vue';
import EventsApi from '@/api';
import { RouterLink } from 'vue-router';
import SearchBar from '@/components/inputs/SearchBar.vue';

export default {
    name: 'HomeView',
    components: { SearchBar, EventPreview, RouterLink },
    data: () => ({
        categories: [],
        nearbyEvents: [],
        popularEvents: [],
        relevantEvents: [],
        soonEvents: [],
        gloc: null
    }),
    mounted() {
        EventsApi.getCategories().then(categories => {
            let index = Math.floor(Math.random() * (categories.length - 8));
            this.categories = categories.slice(index, index + 9);
        });
        this.$geolocation.get().then(loc => {
            this.gloc = loc;
            EventsApi.getEvents({
                lng: loc.lng,
                lat: loc.lat,
                sort: 'relevance',
                datemin: new Date(new Date().getTimezoneOffset() * 60 * 1000).toISOString().split('T')[0],
                timemin: new Date(new Date().getTimezoneOffset() * 60 * 1000).toISOString().substring(11, 19),
                limit: 10,
                timezoneoffset: new Date().getTimezoneOffset()
            }).then(events => {
                this.relevantEvents = events;
            });
            EventsApi.getEvents({
                lng: loc.lng,
                lat: loc.lat,
                sort: 'distance',
                limit: 10
            }).then(events => {
                this.nearbyEvents = events;
            });
        });
        EventsApi.getEvents({
            sort: 'popularity',
            limit: 10
        }).then(events => {
            this.popularEvents = events;
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
    }
}
</script>

<style lang="scss" scoped>
h1 {
    color: var(--color-primary);
    font-family: Chilanka, var(--font-family);
}

section {
    align-items: normal;
}

.categories {
    flex-direction: row;

    .categorie {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        color: inherit;

        .icon {
            width: 1.6em;
            height: 1.6em;
            margin: 0.5em 0;
            border-radius: 8px;
            font-size: 2em;
            transition: border-color 0.3s;
            @include shadow;
        }

        &:hover .icon {
            border-color: var(--color-text);
        }
    }
}

.events-list {
    display: flex;
    overflow: auto;
    scroll-snap-type: x mandatory;
    padding: 0.5em;
    gap: 1em;

    >* {
        flex: 0 0 20em;
        cursor: pointer;
        //scroll-snap-align: center;
        @include interactive;
    }

    .more {
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        @include interactive;
        @include shadow;
    }
}

@media (max-width: 800px) {
    .categorie:nth-child(2n+1) {
        display: none;
    }
}
</style>