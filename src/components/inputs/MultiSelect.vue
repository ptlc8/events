<template>
    <div class="multiselect" tabindex="0" @mouseleave="close" @mouseover="open">
        <span class="add" @click="open">➕ {{ title }}</span>
        <option v-for="option in value" :value="option" @click="removeOption">{{ options[option] }}</option>
        <div class="menu" v-if="opened">
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
    emits: ["update:modelValue", "change"],
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
            this.$emit("change");
        },
        removeOption(event) {
            this.value.splice(this.value.indexOf(event.target.value), 1);
            this.$emit("update:modelValue", this.value);
            this.$emit("change");
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
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, .1);
    background-color: #fff;
    border: 0;
    font: 15px / 20px "Open Sans", "Helvetica Neue", Arial, Helvetica, sans-serif;
    color: #404040;
    color: rgba(0, 0, 0, 0.75);
    vertical-align: top;
    position: relative;
    z-index: 10;

    option,
    span {
        padding: 4px;
        border: 1px solid #606060;
        border-radius: 2px;
        display: inline-block;
        cursor: pointer;
        user-select: none;
        margin-right: 2px;
    }

    .menu {
        position: absolute;
        border-radius: 4px;
        background-color: #fff;
        left: 0;
        width: 100%;
        padding: 8px;
        box-shadow: 0 5px 4px 2px rgba(0, 0, 0, .1);
    }

    @media (orientation: portrait) {
        width: calc(100% - 36px);
    }
}
</style>