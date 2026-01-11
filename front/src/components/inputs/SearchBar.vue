<template>
    <div class="search-bar">
        <img class="invert-on-dark" src="@/assets/icons/search-icon.svg">
        <input type="text" v-model="value" :placeholder="placeholder" @keypress="update" @paste="update" />
    </div>
</template>

<script>
export default {
    name: 'SearchBar',
    props: {
        modelValue: String,
        placeholder: String
    },
    emits: ['update:modelValue'],
    data: vm => ({
        value: vm.modelValue
    }),
    watch: {
        modelValue(value) {
            this.value = value;
        },
        value(value) {
            this.$emit('update:modelValue', value);
        }
    },
    methods: {
        update() {
            this.$emit('update:modelValue', this.value);
        }
    }
}
</script>

<style lang="scss" scoped>
.search-bar {
    width: 100%;
    display: block;
    background-color: var(--color-background);
    border-radius: 8px;
    position: relative;

    img {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        left: 8px;
    }

    input {
        width: 100%;
        background-color: transparent;
        margin: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        padding: 12px 35px;
        box-sizing: border-box;
    }
}
</style>