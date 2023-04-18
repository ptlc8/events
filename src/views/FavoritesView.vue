
<template>
    <section>
        <h1>⭐ {{ Texts.get('fav') }}</h1>
        <MessageBox v-if="!$store.logged" :message="Texts.get('logintofav')" :button="Texts.get('login')" @click="$store.loggingIn = true" />
        <MessageBox v-else-if="!events.length" :message="Texts.get('nofavorites')" :button="Texts.get('searchthem')" @click="$router.push('/search')"></MessageBox>
        <div class="favorites">
            <EventPreview v-for="event in events" :event="event" @click="$store.event = event"></EventPreview>
        </div>
    </section>
</template>

<script>
import MessageBox from '../components/MessageBox.vue';
import EventPreview from '../components/EventPreview.vue';
import EventsApi from '../api';
import Texts from '../texts';
import { watch } from 'vue';
export default {
    name: 'FavoritesView',
    components: {
        MessageBox,
        EventPreview
    },
    setup() {
        return {
            EventsApi,
            Texts
        };
    },
    data() {
        return {
            events: []
        };
    },
    created() {
        this.refresh();
        watch(() => this.$store.logged, this.refresh);
    },
    methods: {
        refresh() {
            EventsApi.getEvents({
                favorite: true
            }).then(events => {
                this.events = events;
            });
        }
    }
}
</script>

<style>
.favorites {
		width: 90%;
		margin: 2em auto;
		display: flex;
		flex-wrap: wrap;
		gap: .5em;
		>* {
				width: 24em;
				flex-grow: 1;
		}
}
</style>