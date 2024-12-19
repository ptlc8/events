<template>
    <div class="distance-input">
        <input type="number" v-model="value" min="0" step="0.1" />
        <select v-model="unit" tabindex="-1">
            <option value="1">km</option>
            <option value="1.609344">mi</option>
        </select>
    </div>
</template>

<script>
export default {
    name: "DistanceInput",
    props: {
        modelValue: {
            type: Number,
            required: false,
            default: null
        }
    },
    emits: ["update:modelValue"],
    data() {
        return {
            value: this.modelValue,
            unit: 1
        };
    },
    watch: {
        modelValue(modelValue) {
            this.value = modelValue / this.unit;
        },
        value(value) {
            let d = value ? value * this.unit : null;
            this.$emit("update:modelValue", d);
            if (!value)
                this.value = "";
        },
        unit(unit) {
            let d = this.value ? this.value * unit : null;
            this.$emit("update:modelValue", d);
        }
    }
};
</script>

<style lang="scss">
.distance-input {
    display: flex;
    align-items: center;
    background-color: var(--color-background);
    border-radius: 4px;
    @include interactive;
    @include shadow;

    input,
    select {
        margin: 0;
        box-shadow: none;
        border: 0;

        &:focus {
            outline-style: none;
        }
    }

    input {
        flex-grow: 1;
        width: 4em;
        text-align: right;
    }

    &:focus-within {
        outline-style: solid;
    }
}
</style>