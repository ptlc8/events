<template>
    <div class="multiselect" tabindex="0" @mouseleave="close" @mouseover="open">
        <span class="add" @click="open">➕ {{ title }}</span>
        <option v-for="option in value" :value="option" @click="removeOption">{{ options[option] }}</option>
        <div class="dropdown" v-if="opened">
            <hr />
            <option v-for="option in Object.keys(options).filter(o => !value.includes(o))" :value="option"
                @click="addOption">{{ options[option] }}</option>
        </div>
    </div>
</template>

<script>
export default {
    name: "MultiSelect",
    props: {
        title: {
            type: String,
            required: false,
            default: "Ajouter"
        },
        options: {
            type: Object,
            required: true
        },
        modelValue: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    emits: ["update:modelValue"],
    data: () => ({
        opened: false,
        value: []
    }),
    watch: {
        modelValue(value) {
            this.value = value;
        }
    },
    methods: {
        addOption(event) {
            this.value.push(event.target.value);
            this.$emit("update:modelValue", this.value);
        },
        removeOption(event) {
            this.value.splice(this.value.indexOf(event.target.value), 1);
            this.$emit("update:modelValue", this.value);
        },
        open() {
            this.opened = true;
        },
        close() {
            this.opened = false;
        }
    }
}
</script>

<style lang="scss">
.multiselect {
    display: inline-block;
    border-radius: 4px;
    padding: 8px;
    background-color: var(--color-background);
    border: 0;
    font: 15px / 20px "Open Sans", "Helvetica Neue", Arial, Helvetica, sans-serif;
    color: var(--color-text);
    vertical-align: top;
    position: relative;
    z-index: 10;
    @include interactive;
    @include shadow;

    option,
    span {
        padding: 2px;
        border: 1px solid var(--color-border);
        border-radius: 2px;
        display: inline-block;
        user-select: none;
        margin: 1px;

        &[value] {
            cursor: pointer;

            &:hover {
                color: var(--color-heading);
                border-color: var(--color-heading);
            }
        }
    }

    .dropdown {
        position: absolute;
        border-radius: 4px;
        background-color: var(--color-background);
        left: 0;
        width: 100%;
        width: calc(100% + 4px);
        padding: 8px;
        margin-left: -2px;
        @include shadow-bottom;
    }

    @media (orientation: portrait) {
        width: calc(100% - 36px);
    }
}
</style>