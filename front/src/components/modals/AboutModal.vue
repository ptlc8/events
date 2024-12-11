<template>
    <Modal>
        <h1>{{ $text.get('about') }}</h1>
        <p v-for="line in $text.get('about_text')">
            {{ line }}
        </p>
        <a :href="'mailto:' + email">{{ email }}</a>
        <br />
        <center>{{ author }} {{ new Date().getFullYear() }} - {{ $text.get('all_rights_reserved') }}</center>
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