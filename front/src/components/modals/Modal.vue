<template>
  <Transition name="modal">
    <div class="modal-container" v-if="show" @click.self="close">
      <div class="modal" :class="{ big }">
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
    },
    big: {
      type: Boolean,
      default: false
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
  background: var(--color-background);
  border-radius: 8px;
  width: 32em;
  padding: 1em 2em;
  @include shadow;

  .close {
    position: absolute;
    top: 1em;
    right: 1em;
    width: 1.5em;
    height: 1.5em;
    cursor: pointer;
    z-index: 100;
    transition: 0.3s;

    &:hover {
      transform: scale(1.1);
    }
  }

  &.big {
    padding: 0;
    width: 48em;
    height: 48em;
    max-height: 100%;
    overflow: auto;
  }
}

@media (max-width: 800px) {
  .modal.big {
    height: 100%;
    width: 100%;

    .close {
      position: fixed;
    }
  }
}
</style>