<template>
    <Modal>
        <h1>{{ $t.about }}</h1>
        <p v-for="line in $t.about_text">
            {{ line }}
        </p>
        <a :href="'mailto:' + email">{{ email }}</a>
        <br />
        <p class="copyright">{{ author }} {{ new Date().getFullYear() }} - {{ $t.all_rights_reserved }}</p>
    </Modal>
</template>

<script>
import Modal from './Modal.vue';

export default {
    name: 'AboutModal',
    components: { Modal },
    data: () => ({
        email: 'ptlcptlcptlc@gmail.com',
        author: 'Ambi'
    })
}
</script>

<style scoped lang="scss">
.copyright {
    font-size: .8em;
    text-align: center;
}
</style>