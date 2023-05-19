<template>
  <div :class="{ 'interval-select': true, opened }" tabindex="0" @mouseleave="close" @mouseover="open" @keydown.up.prevent="previous" @keydown.down.prevent="next">
    <span class="value">{{ getLabel() }}</span>
    <div class="dropdown" v-if="opened">
      <div class="option" v-for="option in options" @click="void (_min = option.min) || (_max = option.max)">
        {{ option.label }}
      </div>
      <label>minimum</label>
      <div class="inputs-wrapper">
        <input :type="type" v-model="_min" />
        <button class="reset" @click="_min=undefined">✖</button>
      </div>
      <label>maximum</label>
      <div class="inputs-wrapper">
        <input :type="type" v-model="_max" />
        <button class="reset" @click="_max=undefined">✖</button>
      </div>
      <button @click="close">OK</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "IntervalSelect",
  props: {
    modelValue: {
      type: Object,
      required: false,
      default: () => ({ min: undefined, max: undefined })
    },
    options: {
      type: Array,
      required: false,
      default: () => []
    },
    type: {
      type: String,
      required: true
    }
  },
  emits: ['change', 'update:modelValue'],
  data: () => ({
    opened: false,
    _min: null,
    _max: null
  }),
  watch: {
    modelValue(value) {
      this._min = value.min;
      this._max = value.max;
    },
    _min(min) {
      this.$emit('update:modelValue', { min, max: this._max });
      this.$emit('change');
    },
    _max(max) {
      this.$emit('update:modelValue', { min: this._min, max });
      this.$emit('change');
    }
  },
  mounted() {
    this._min = this.modelValue.min;
    this._max = this.modelValue.max;
  },
  methods: {
    open() {
      this.opened = true;
    },
    close() {
      this.opened = false;
    },
    previous() {
      let i = this.options.indexOf(this.getOption());
      if (i > 0) {
        this._min = this.options[i - 1].min;
        this._max = this.options[i - 1].max;
      }
    },
    next() {
      let i = this.options.indexOf(this.getOption());
      if (i >= 0 && i < this.options.length - 1) {
        this._min = this.options[i + 1].min;
        this._max = this.options[i + 1].max;
      }
    },
    getOption() {
      return this.options.find(o => o.min === this._min && o.max === this._max);
    },
    getLabel() {
      if (this.getOption())
        return this.getOption().label;
      if (this._max && this._min)
        return "Entre " + this._min.split("-").reverse().join("/") + " et " + this._max.split("-").reverse().join("/");
      if (this._max)
        return "Avant " + this._max.split("-").reverse().join("/");
      if (this._min)
        return "Après " + this._min.split("-").reverse().join("/");
      return "Peu importe";
    }
  }
}
</script>

<style lang="scss" scoped>
.interval-select {
  border-radius: 4px;
  padding: 12px 8px;
  box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  border: 0;
  font: 15px/20px "Open Sans", "Helvetica Neue", Arial, Helvetica, sans-serif;
  color: #404040;
  color: rgba(0, 0, 0, 0.75);
  z-index: 10;
  cursor: pointer;

  &::after {
    content: "▼";
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  &.opened {
    z-index: 100;
  }

  .value {
    height: 100%;
    display: flex;
    align-items: center;
    margin: 0 1em;
  }

  .dropdown {
    position: absolute;
    border-radius: 0 0 4px 4px;
    background-color: #fff;
    top: 100%;
    left: 0;
    width: 100%;
    padding: 8px;
    margin-top: -2px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 5px 4px 2px rgba(0, 0, 0, .1);
    border-top: solid 1px var(--color-border);
    user-select: none;

    .option,
    input,
    button {
      padding: 2px 1em;
      margin: 2px 0;
      border: solid 1px var(--color-border);
      border-radius: 4px;
    }

    .reset {
      width: 2em;
      height: 2em;
      background-color: indianred;
      padding: 0;
      margin: 2px 0 2px 4px;
    }

    .option {
      cursor: pointer;

      &:hover {
        background-color: var(--color-primary);
      }
    }

    label {
      margin: 4px 1em 0 1em;
      line-height: 1;
      font-size: .8em;
      color: var(--color-primary);
    }

    .inputs-wrapper {
      display: flex;

      input {
        flex-grow: 1;
      }
    }

    input {
      background-color: var(--color-border);
      box-shadow: none;
    }
  }
}
</style>