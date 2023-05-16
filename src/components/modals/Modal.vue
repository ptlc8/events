<template>
  <Transition name="modal">
    <div class="modal-container" v-if="show" @click.self="close">
      <div class="modal">
        <img class="close" src="@/assets/icons/cross.svg" @click="close">
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>
  
<script>
export default {
  name: "Modal",
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close'],
  methods: {
    close() {
      this.$emit("close");
    }
  }
};
</script>
  
<style lang="scss">
.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 0.5em;
  width: 32em;
  box-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
  padding: 1em 2em;

  .close {
    position: absolute;
    top: 1em;
    right: 1em;
    width: 1.5em;
    height: 1.5em;
    cursor: pointer;
    z-index: 100;
  }
}
</style>