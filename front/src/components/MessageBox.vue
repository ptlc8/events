<template>
    <div>
        {{ message }}
        <button v-if="button" @click="$emit('click')">{{ button }}</button>
    </div>
</template>

<script>
export default {
    name: "MessageBox",
    props: {
        message: {
            type: String,
            required: true
        },
        button: {
            type: String,
            required: false,
            default: null
        }
    },
    emits: ["click"]
}
</script>

<style lang="scss" scoped>
div {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: fit-content;
    margin: auto;
    padding: 1em 2em;
    border-radius: 8px;
    text-align: center;
    @include shadow;
}
</style>