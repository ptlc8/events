<template>
    <article v-if="event" class="event-preview">
        <span class="title">{{ event.title }}</span>
        <div class="wrapper">
            <div class="picture" :style="'background-image: url(\'' + banner.url + '\');'" :title="banner.credits">
                <span v-if="banner.nonRepresentative" :title="$t.non_representative">❗</span>
            </div>
            <div class="infos">
                <span class="description">{{ event.description }}</span>
                <span class="categories">
                    <span v-for="c in categories">{{ c.emoji }} {{ $t[c.id] }}</span>
                </span>
                <span class="whenwhere">
                    <b>{{ $texts.getDisplayDateTime(event.start) }}</b>
                    à <b>{{ event.placename }}</b>
                </span>
                <button class="infos-button" @click="$emit('click')">{{ $t.more_info }}</button>
                <slot></slot>
            </div>
        </div>
    </article>
    <article v-else class="loading event-preview"></article>
</template>

<script>
import { backendUrl } from '@/config.js';

export default {
    name: "EventPreview",
    props: {
        event: {
            type: Object
        }
    },
    emits: ["click"],
    data: () => ({
        allCategories: []
    }),
    mounted() {
        this.$api.getCategories().then(cats => this.allCategories = cats);
    },
    computed: {
        banner() {
            var nonRepresentative = !!this.event.nonRepresentativeImage;
            return {
                url: nonRepresentative ? backendUrl + this.event.nonRepresentativeImage : this.event.images[0],
                credits: nonRepresentative ? this.$t.non_representative : this.event.imagesCredits[0],
                nonRepresentative
            }
        },
        categories() {
            if (!this.allCategories.length)
                return [];
            return this.event.categories.map(id => this.allCategories.find(c => c.id == id));
        }
    }
}
</script>

<style lang="scss">
.event-preview {
    min-height: 16em;
    justify-content: space-between;

    .wrapper {
        display: flex;
        gap: 8px;
        flex-grow: 1;
    }

    .picture {
        display: inline-block;
        flex: 3;
        background: center center / cover var(--color-background-mute);
        border-radius: 4px;
    }

    .infos {
        flex: 3;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between
    }

    .title {
        display: block;
        font-size: x-large;
        font-variant: small-caps;
        margin-left: 1em;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .description {
        display: -webkit-inline-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-align: justify;
        line-height: 1.2;
        max-height: 5em;
        word-break: break-word;
    }

    .categories {
        font-size: .8em;
        overflow: hidden;
        line-height: 1.5;
        max-height: 1.5em;

        span {
            border: 1px solid var(--color-border);
            border-radius: 0.25em;
            margin: 0.25em;
            padding: 0 0.25em;
        }
    }

    .whenwhere {
        margin-left: 2em;
    }

    button {
        width: 80%;
        align-self: center;
        font-weight: bold;
    }
}
</style>