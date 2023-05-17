<template>
    <div class="distance-input">
        <input type="number" v-model="value" min="0" step="0.1">
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
            type: [Number, null],
            required: true
        }
    },
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
            this.$emit("update:modelValue", value * this.unit);
        },
        unit(unit) {
            this.$emit("update:modelValue", this.value * unit);
        }
    }
};
</script>

<style lang="scss">
.distance-input {
    display: flex;
    align-items: center;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, .1);

    input,
    select {
        margin: 0;
        box-shadow: none;

        &:focus {
            outline: none;
        }
    }

    input {
        flex-grow: 1;
        width: 4em;
        text-align: right;
    }

    &:focus-within {
        outline: solid 2px black;
    }
}
</style>