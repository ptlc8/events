<template>
  <div v-if="datetime">
    <span class="month">{{ month }}</span>
    <span class="day">{{ day }}</span>
    <span class="weekday">{{ weekday }}</span>
  </div>
  <div v-else class="loading"></div>
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
      return new Date(this.datetime).toLocaleString(this.$texts.getLang(), { month: "long" });
    },
    day() {
      return new Date(this.datetime).toLocaleString(this.$texts.getLang(), { day: "numeric" });
    },
    weekday() {
      return new Date(this.datetime).toLocaleString(this.$texts.getLang(), { weekday: "long" });
    }
  }
};
</script>

<style lang="scss" scoped>
div {
  width: 8em;
  height: 8em;
  background-color: #f2f2f2;
  color: #181818;
  border-radius: .5em;
  text-align: center;
  overflow: hidden;
  border: solid 1px var(--color-border);
  @include shadow;

  .month {
    display: block;
    background-color: #f02e2e;
    font-size: 1.6em;
    line-height: 1.4;
    color: #f2f2f2;
  }

  .day {
    display: block;
    font-size: 3.2em;
    line-height: 1.2;
  }
}
</style>