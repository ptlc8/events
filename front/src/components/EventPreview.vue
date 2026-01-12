<template>
    <article v-if="event" class="event-preview" @click="$emit('click')">
        <span class="title">{{ event.title }}</span>
        <div class="picture" :style="'background-image: url(\'' + banner.url + '\');'" :title="banner.credits">
            <span v-if="banner.nonRepresentative" :title="$t.non_representative">❗</span>
        </div>
        <div class="infos">
            <div class="date">
                <div class="month">{{ $texts.getDisplayMonth(event.start) }}</div>
                <div class="day">{{ $texts.getDisplayDay(event.start) }}</div>
            </div>
            <div class="details">
                <div>📍 {{ event.placename }}</div>
                <div>🕓 {{ $texts.getDisplayTime(event.start) }}</div>
                <div class="categories">
                    <span v-for="c in categories">{{ c.emoji }} {{ $t[c.id] }}</span>
                </div>
            </div>
        </div>
        <slot></slot>
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
    display: flex;
    flex-direction: column;
    align-items: normal;
    gap: 8px;
    cursor: pointer;
    @include interactive;

    .picture {
        background: center center / cover var(--color-background-mute);
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
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-right: 2px solid var(--color-text);
            margin: 0 8px;
            padding-right: 8px;
            text-align: center;

            .month {
                font-size: 1.2em;
                line-height: 1;
                text-transform: uppercase;
            }

            .day {
                font-size: 2.4em;
                line-height: 1;
            }
        }

        .details {
            display: flex;
            flex-direction: column;

            > * {
                line-height: 1.5;
                max-height: 1.5em;
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