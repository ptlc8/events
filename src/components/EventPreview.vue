<template>
    <article>
        <span class="title">{{ event.title }}</span>
        <div class="wrapper">
            <div class="picture" :style="'background-image: url(\'' + event.images[0] + '\');'"></div>
            <div class="infos">
                <span class="description">{{ event.description }}</span>
                <span class="categories">
                    <span v-for="cat in event.categories">{{ Texts.get(cat) }}</span>
                </span>
                <span class="whenwhere">
                    <b>{{ Texts.getDisplayDateTime(event.datetime) }}</b>
                    à <b>{{ event.placename }}</b>
                </span>
                <button class="infos-button" @click="$emit('click')">Plus d'infos</button>
            </div>
        </div>
    </article>
</template>

<script>
import Texts from "../texts.js";
export default {
    name: "EventPreview",
    props: {
        event: {
            type: Object,
            required: true
        }
    },
    emits: ["click"],
    setup() {
        return { Texts };
    }
}
</script>

<style lang="scss" scoped>
article {
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, .1);
    border-radius: 4px;
    padding: 8px;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.wrapper {
    display: flex;
    gap: 8px;
    flex-grow: 1;
}

.picture {
    display: inline-block;
    flex: 3;
    background: center center / cover #f4f4f4;
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

.infos-button {
    width: 80%;
    align-self: center;
    font-weight: bold;
}
</style>