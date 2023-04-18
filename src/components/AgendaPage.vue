<template>
  <div>
    <span class="month">{{ month }}</span>
    <span class="day">{{ day }}</span>
    <span class="weekday">{{ weekday }}</span>
  </div>
</template>

<script>
export default {
  name: "AgendaPage",
  props: {
    datetime: {
      type: String,
      required: true
    }
  },
  computed: {
    month() {
      return new Date(this.datetime).toLocaleString(this.$text.getLang(), { month: "long" });
    },
    day() {
      return new Date(this.datetime).toLocaleString(this.$text.getLang(), { day: "numeric" });
    },
    weekday() {
      return new Date(this.datetime).toLocaleString(this.$text.getLang(), { weekday: "long" });
    }
  }
};
</script>

<style lang="scss" scoped>
div {
  width: 8em;
  border-radius: .5em;
  text-align: center;
  overflow: hidden;
  border: solid 1px var(--color-border);
  box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);

  .month {
    display: block;
    background-color: #f02e2e;
    font-size: 1.6em;
    line-height: 1.4;
  }

  .day {
    display: block;
    font-size: 3.2em;
    line-height: 1.2;
  }
}
</style>