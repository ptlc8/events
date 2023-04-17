<template>
    <article>
        <div class="picture" :style="'background-image: url(\'' + event.images[0] + '\');'"></div>
        <div class="infos">
            <span class="title">{{ event.title }}</span>
            <span class="description">{{ event.description }}</span>
            <span class="categories">{{ event.categories.join(", ") }}</span>
            <span class="whenwhere">
                <b>{{ Texts.getDisplayDateTime(event.datetime) }}</b>
                à <b>{{ event.placename }}</b>
            </span>
            <button class="infos-button" @click="$emit('click')">Plus d'infos</button>
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
    margin-top: 10px;
    display: flex;
}

.picture {
    display: inline-block;
    flex: 1;
    background: center center / cover #f4f4f4;
    border-radius: 4px;
}

.infos {
    margin-left: 8px;
    flex: 3;
    position: relative;
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
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-align: justify;
    line-height: 1.2;
}

.categories {
    display: block;
    font-size: .8em;
}

.whenwhere {
    /*position: absolute; bottom: 10px;*/
    margin-left: 2em;
}

.infos-button {
    position: absolute;
    bottom: 4px;
    right: 16px;
    font-weight: bold;
}
</style>