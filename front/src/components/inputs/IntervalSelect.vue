<template>
  <div :class="{ 'interval-select': true, opened }" tabindex="0" @mouseleave="close" @mouseover="open" @keydown.up.prevent="previous" @keydown.down.prevent="next">
    <span class="value">{{ getLabel() }}</span>
    <div class="dropdown" v-if="opened">
      <div class="option" v-for="option in options" @click="void (value.min = option.min) || (value.max = option.max)">
        {{ option.label }}
      </div>
      <label>{{ $t.minimum }}</label>
      <div class="inputs-wrapper">
        <input :type="type" v-model="value.min" />
        <button class="reset" @click="value.min=undefined">✖</button>
      </div>
      <label>{{ $t.maximum }}</label>
      <div class="inputs-wrapper">
        <input :type="type" v-model="value.max" />
        <button class="reset" @click="value.max=undefined">✖</button>
      </div>
      <button @click="close">{{ $t.ok }}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "IntervalSelect",
  props: {
    modelValue: { // UTC timezone
      type: Object,
      required: false,
      default: () => ({ min: undefined, max: undefined })
    },
    options: { // local timezone
      type: Array,
      validator: value => value.every(o => 'label' in o),
      required: false,
      default: () => []
    },
    type: {
      type: String,
      validator: value => ['date', 'time'].includes(value),
      required: true
    }
  },
  emits: ['update:modelValue'],
  data: () => ({
    opened: false,
    value: { min: null, max: null },
  }),
  watch: {
    modelValue(value) {
      this.value.min = this.fromUTC(value.min);
      this.value.max = this.fromUTC(value.max);
    },
    value: {
      handler(value) {
        this.$emit('update:modelValue', {
          min: this.toUTC(value.min),
          max: this.toUTC(value.max)
        });
      },
      deep: true
    }
  },
  mounted() {
    this.value.min = this.fromUTC(this.modelValue.min);
    this.value.max = this.fromUTC(this.modelValue.max);
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
        this.value = { min: this.options[i - 1].min, max: this.options[i - 1].max };
      }
    },
    next() {
      let i = this.options.indexOf(this.getOption());
      if (i >= 0 && i < this.options.length - 1) {
        this.value = { min: this.options[i + 1].min, max: this.options[i + 1].max};
      }
    },
    getOption() {
      return this.options.find(o => o.min == this.value.min && o.max == this.value.max);
    },
    getLabel() {
      if (this.getOption())
        return this.getOption().label;
      if (this.value.max && this.value.min)
        return "Entre " + this.value.min.split("-").reverse().join("/") + " et " + this.value.max.split("-").reverse().join("/");
      if (this.value.max)
        return "Avant " + this.value.max.split("-").reverse().join("/");
      if (this.value.min)
        return "Après " + this.value.min.split("-").reverse().join("/");
      return "Peu importe";
    },
    toUTC(value) {
      if (!value)
        return value;
      let date = new Date();
      if (this.type === 'time') {
        let parts = value.split(":").map(Number);
        date.setHours(parts[0]);
        date.setMinutes(parts[1]);
        return date.toISOString().substring(11, 16);
      } else if (this.type === 'date') {
        let parts = value.split("-").map(Number);
        date.setFullYear(parts[0]);
        date.setMonth(parts[1] - 1);
        date.setDate(parts[2]);
        date.setHours(0, 0, 0, 0);
        return date.toISOString().substring(0, 16);
      }
      return value;
    },
    fromUTC(value) {
      if (!value)
        return value;
      if (this.type === 'time') {
        let utcDate = new Date().toISOString().substring(0, 10);
        let date = new Date(utcDate + "T" + value + "Z");
        return date.getHours().toString().padStart(2, '0')
          + ":" + date.getMinutes().toString().padStart(2, '0');
      } else if (this.type === 'date') {
        let date = new Date(value + "Z");
        return date.getFullYear()
          + "-" + (date.getMonth() + 1).toString().padStart(2, '0')
          + "-" + date.getDate().toString().padStart(2, '0');
      }
      return value;
    }
  }
}
</script>

<style lang="scss" scoped>
.interval-select {
  border-radius: 8px;
  padding: 12px 8px;
  background-color: var(--color-background);
  border: 0;
  font: 15px/20px "Open Sans", "Helvetica Neue", Arial, Helvetica, sans-serif;
  color: var(--color-text);
  z-index: 10;
  cursor: pointer;
  @include interactive;
  @include shadow;

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
    border-radius: 8px 8px 0 0;
  }

  .value {
    height: 100%;
    display: flex;
    align-items: center;
    margin: 0 16px;
  }

  .dropdown {
    position: absolute;
    border-radius: 0 0 8px 8px;
    background-color: var(--color-background);
    top: 100%;
    left: 0;
    width: 100%;
    width: calc(100% + 4px);
    padding: 8px;
    margin-top: -2px;
    margin-left: -2px;
    display: flex;
    flex-direction: column;
    border-top: solid 1px var(--color-border);
    user-select: none;
    @include shadow-bottom;

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
      color: #f2f2f2;
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