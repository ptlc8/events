<template>
    <MessageBox v-if="loggedin === null" :message="$t.logging_in" />
    <MessageBox v-else-if="loggedin" :message="$t.logged_in" :button="$t.ok" @click="$router.push('/')" />
    <MessageBox v-else :message="$t.logging_in_failed" :button="$t.retry" @click="$store.login" />
</template>

<script>
import MessageBox from '@/components/MessageBox.vue';

export default {
    name: 'ConnectView',
    components: {
        MessageBox
    },
    data() {
        return {
            loggedin: null
        };
    },
    mounted() {
        var token = this.$route.query.token;
        this.$api.loginWith(token).then(user => {
            if (opener)
                opener.postMessage({ target: 'events', loggedin: true, user });
            this.$store.setLoggedUser(user);
            this.loggedin = true;
        }).catch(() => {
            if (opener)
                opener.postMessage({ target: 'events', loggedin: false });
            this.loggedin = false;
        });
    }
}
</script>