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
      if (!this.datetime) return "";
      return new Date(this.datetime).toLocaleString(this.$texts.getLang(), { month: "long" });
    },
    day() {
      if (!this.datetime) return "";
      return new Date(this.datetime).toLocaleString(this.$texts.getLang(), { day: "numeric" });
    },
    weekday() {
      if (!this.datetime) return "";
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
  border-radius: 8px;
  text-align: center;
  overflow: hidden;
  border: solid 1px var(--color-border);
  @include shadow;

  .month {
    display: block;
    height: 1.6em;
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