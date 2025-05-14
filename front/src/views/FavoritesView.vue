
<template>
    <section>
        <MessageBox v-if="!$store.logged" :message="$t.login_to_fav" :button="$t.login" @click="$store.login" />
        <MessageBox v-else-if="!events.length" :message="$t.no_favorites" :button="$t.search_them" @click="$router.push('/search')"></MessageBox>
        <div class="favorites">
            <EventPreview v-for="event in events" :event="event" @click="$store.event = event">
                <button class="delete-event" @click="remove(event.id)">{{ $t.remove_fav }}</button>
            </EventPreview>
        </div>
    </section>
</template>

<script>
import MessageBox from '@/components/MessageBox.vue';
import EventPreview from '@/components/EventPreview.vue';
import { watch } from 'vue';

export default {
    name: 'FavoritesView',
    components: {
        MessageBox,
        EventPreview
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
            this.$api.getEvents({
                favorite: true
            }).then(events => {
                this.events = events;
            });
        },
        remove(id) {
            this.$api.removeFavorite(id).then(() => {
                this.refresh();
            });
        }
    }
}
</script>

<style scoped lang="scss">
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

    .delete-event {
        background-color: indianred;
    }
}
</style>
