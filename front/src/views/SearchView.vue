<template>
    <KeepAlive>
        <EventsMap v-if="showMap" :search="search" class="results map" />
    </KeepAlive>
    <section>
        <SearchInputs v-model="search" :for-map="showMap" />
        <div class="result-type">
            <button @click="showMap = false" :class="{ active: !showMap }">{{ $t.show_list }}</button>
            <button @click="showMap = true" :class="{ active: showMap }">{{ $t.show_map }}</button>
        </div>
        <KeepAlive>
            <EventsList v-if="!showMap" :search="search" class="results" />
        </KeepAlive>
    </section>
</template>

<script>
import EventsMap from '@/components/EventsMap.vue';
import EventsList from '@/components/EventsList.vue';
import { default as SearchInputs, formatRelativeDate } from '@/components/SearchInputs.vue';

export default {
    name: 'SearchView',
    components: {
        SearchInputs,
        EventsList,
        EventsMap
    },
    data: vm => ({
        search: vm.getSearchFromQuery(vm.$route.query),
        showMap: vm.$route.query.map !== undefined
    }),
    watch: {
        $route(to) {
            this.search = this.getSearchFromQuery(to.query);
            this.showMap = to.query.map !== undefined;
        },
        search: {
            handler(value) {
                this.$router.replace({ ...this.$route, query: { ...this.$route.query, ...this.getSearchInQueryFormat(value) } });
            },
            deep: true
        },
        showMap(value) {
            this.$router.replace({ ...this.$route, query: { ...this.$route.query, map: value ? null : undefined } });
        }
    },
    methods: {
        getSearchFromQuery(query) {
            let [lng, lat] = query.g?.split(',') ?? [];
            let [dmin, dmax] = query.d?.split(',') ?? [];
            let [tmin, tmax] = query.t?.split(',') ?? [];
            let now = new Date().toISOString().substring(0, 16) + 'Z';
            return {    
                text: query.q ?? '',
                cats: query.c?.split(',') ?? [],
                sort: query.s ?? 'relevance',
                date: { min: (dmin ?? now) || null, max: dmax || null },
                time: { min: tmin || null, max: tmax || null },
                gloc: query.g ? { lng: parseFloat(lng), lat: parseFloat(lat) } : undefined,
                dist: isNaN(parseInt(query.r)) ? undefined : parseInt(query.r)
            };
        },
        getSearchInQueryFormat(search) {
            return {
                q: search.text || undefined,
                c: search.cats.length > 0 ? search.cats.join(',') : undefined,
                s: search.sort != 'relevance' ? search.sort : undefined,
                d: (search.date?.min || search.date?.max) ? (search.date.min ?? '') + ',' + (search.date.max ?? '') : undefined,
                t: (search.time?.min || search.time?.max) ? (search.time.min ?? '') + ',' + (search.time.max ?? '') : undefined,
                g: search.gloc ? search.gloc.lng + ',' + search.gloc.lat : undefined,
                r: search.dist ? search.dist : undefined // r for radius
            };
        }
    }
}
</script>

<style lang="scss" scoped>
.map {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

section {
    pointer-events: none;

    >* {
        pointer-events: auto;
    }
}

.result-type {
    flex: 0 0 auto;
    margin: 1em 0;
    overflow: hidden;
    border-radius: 10em;
    background-color: var(--color-background);
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, .1);

    button {
        margin: 0;
        padding: 12px 24px;
        background: none;
        color: var(--color-text);
        border-radius: 0;
        box-shadow: none;

        &.active {
            font-weight: bold;
            background-color: var(--color-primary);
            color: var(--color-background);
        }

        &:first-child {
            border-radius: 10em 0 0 10em;
        }

        &:last-child {
            border-radius: 0 10em 10em 0;
        }
    }
}
</style>