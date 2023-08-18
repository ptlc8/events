<template>
    <MessageBox v-if="loggedin === null" :message="$text.get('loggingin')" />
    <MessageBox v-else-if="loggedin" :message="$text.get('loggedin')" :button="$text.get('ok')" @click="$router.push('/')" />
    <MessageBox v-else :message="$text.get('logginginfailed')" :button="$text.get('retry')" @click="$store.login" />
</template>

<script>
import EventsApi from '@/api';
import MessageBox from '../components/MessageBox.vue';
export default {
    name: 'ConnectView',
    components: {
        MessageBox
    },
    setup() {
        return {
            EventsApi
        };
    },
    data() {
        return {
            loggedin: null
        };
    },
    mounted() {
        var token = this.$route.query.token;
        EventsApi.loginWith(token).then(user => {
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