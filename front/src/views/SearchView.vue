<template>
    <section>
        <SearchInputs v-model="search" />
        <EventsList :search="search" />
    </section>
</template>

<script>
import EventsList from '@/components/EventsList.vue';
import { default as SearchInputs, formatRelativeDate } from '@/components/SearchInputs.vue';

export default {
    name: 'SearchView',
    components: {
        EventsList,
        SearchInputs
    },
    data: vm => ({
        search: vm.getSearchFromQuery(vm.$route.query)
    }),
    watch: {
        search: {
            handler(value) {
                this.$router.replace({ query: { ...this.$route.query, ...this.getSearchInQueryFormat(value) } });
            },
            deep: true
        }
    },
    methods: {
        getSearchFromQuery(query) {
            let [lng, lat] = query.g?.split(',') ?? [];
            let [dmin, dmax] = query.d?.split(',') ?? [];
            let [tmin, tmax] = query.t?.split(',') ?? [];
            return {
                text: query.q ?? '',
                cats: query.c?.split(',') ?? [],
                sort: query.s ?? 'relevance',
                date: { min: formatRelativeDate(0), max: dmax },
                time: { min: tmin, max: tmax },
                gloc: query.g ? { lng: parseFloat(lng), lat: parseFloat(lat) } : undefined,
                dist: isNaN(parseInt(query.r)) ? undefined : parseInt(query.r)
            };
        },
        getSearchInQueryFormat(search) {
            var query = {};
            if (search.text) query.q = search.text;
            if (search.cats.length > 0) query.c = search.cats.join(',');
            if (search.sort != 'relevance') query.s = search.sort;
            if (search.date?.min || search.date?.max) query.d = (search.date.min ?? '') + ',' + (search.date.max ?? '');
            if (search.time?.min || search.time?.max) query.t = (search.time.min ?? '') + ',' + (search.time.max ?? '');
            if (search.gloc) query.g = search.gloc.lng + ',' + search.gloc.lat;
            if (search.dist) query.r = search.dist; // r for radius
            return query;
        }
    }
}
</script>