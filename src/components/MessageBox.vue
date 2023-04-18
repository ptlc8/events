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

<style scoped>
div {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: fit-content;
    margin: 4em auto;
    padding: 1em 2em;
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, .1);
    border-radius: 4px;
		text-align: center;
}
</style>