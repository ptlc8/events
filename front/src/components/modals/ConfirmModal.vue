<template>
  <Modal $v-bind="$attrs" ref="modal">
    <img class="close" src="@/assets/icons/cross.svg" @click="close">
    {{ message }}
    <button @click="yes">Oui</button>
    <button @click="no">Non</button>
  </Modal>
</template>

<script>
import Modal from './Modal.vue';

export default {
  name: "ConfirmModal",
  emits: ["yes", "no"],
  props: {
    message: {
      type: String,
      required: true
    }
  },
  components: { Modal },
  methods: {
    yes() {
      this.$emit("yes");
      this.$refs.modal.close();
    },
    no() {
      this.$emit("no");
      this.$refs.modal.close();
    }
  }
};
</script>

<style lang="scss" scoped>
button {
  width: 100%;
  margin-bottom: 0.5em;
}
</style>