<template>
    <Modal>
        <h1>{{ $text.get('about') }}</h1>
        <p v-for="line in $text.get('about_text')">
            {{ line }}
        </p>
        <a :href="'mailto:' + email">{{ email }}</a>
        <br />
        <p class="copyright">{{ author }} {{ new Date().getFullYear() }} - {{ $text.get('all_rights_reserved') }}</p>
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