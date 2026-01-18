<template>
    <article class="event-preview" @click="$emit('click')">
        <span :class="{ title: true, loading }">{{ event?.title }}</span>
        <div :class="{ picture: true, loading }" :style="'background-image: url(\'' + banner?.url + '\');'" :title="banner?.credits">
            <span v-if="banner?.nonRepresentative" :title="$t.non_representative">❗</span>
        </div>
        <div class="infos">
            <div class="date">
                <div :class="{ month: true, loading }">{{ $texts.getDisplayMonth(event?.start) }}</div>
                <div :class="{ day: true, loading }">{{ $texts.getDisplayDay(event?.start) }}</div>
            </div>
            <div class="details">
                <div :class="{ loading }">📍 {{ event?.placename }}</div>
                <div :class="{ loading }">🕓 {{ $texts.getDisplayTime(event?.start) }}</div>
                <div :class="{ categories: true, loading }">
                    <span v-for="c in categories">{{ c.emoji }} {{ $t[c.id] }}</span>
                </div>
            </div>
        </div>
        <slot></slot>
    </article>
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
        loading() {
            return this.event === undefined;
        },
        banner() {
            if (!this.event?.images) return null;
            var nonRepresentative = !!this.event.nonRepresentativeImage;
            return {
                url: nonRepresentative ? backendUrl + this.event.nonRepresentativeImage : this.event.images[0],
                credits: nonRepresentative ? this.$t.non_representative : this.event.imagesCredits?.[0],
                nonRepresentative
            }
        },
        categories() {
            if (!this.event?.categories || !this.allCategories.length)
                return [];
            return this.event.categories.map(id => this.allCategories.find(c => c.id == id));
        }
    }
}
</script>

<style lang="scss">
.event-preview {
    display: flex;
    flex-direction: column;
    align-items: normal;
    gap: 8px;
    cursor: pointer;
    @include interactive;

    .picture {
        background-position: center;
        background-size: cover;
        background-color: var(--color-background-mute);
        border-radius: 4px;
        min-height: 12em;
    }

    .title {
        display: block;
        font-size: x-large;
        font-variant: small-caps;
        margin: 0 8px;
        overflow: hidden;
        word-break: break-all;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
    }

    .infos {
        flex: 1;
        display: flex;
        flex-direction: row;
    
        .date {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.1em;
            border-right: 2px solid var(--color-text);
            margin: 0 8px;
            padding-right: 8px;
            text-align: center;

            .month {
                min-height: 1em;
                font-size: 1.2em;
                line-height: 1;
                text-transform: uppercase;
            }

            .day {
                min-height: 1em;
                font-size: 2.4em;
                line-height: 1;
            }
        }

        .details {
            flex: 4;
            display: flex;
            flex-direction: column;
            gap: .1em;

            > * {
                height: 1.6em;
                overflow: hidden;
                word-break: break-all;
                display: -webkit-inline-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 1;
            }

            .categories {
                font-size: .8em;

                span {
                    border: 1px solid var(--color-border);
                    border-radius: 0.25em;
                    margin: 0.25em;
                    padding: 0 0.25em;
                }
            }
        }
    }
}
</style>