<template>
    <a v-for="link in contactsLinks" :href="link.href" target="_blank" :title="link.text">{{ link.text }}</a>
</template>

<script>
export default {
    name: "Contacts",
    props: {
        contacts: {
            type: Array,
            required: true
        }
    },
    computed: {
        contactsLinks() {
            return this.contacts.map(c => {
                if (c.startsWith("http"))
                    return { href: c, text: c };
                if (c.includes("@"))
                    return { href: "mailto:" + c, text: c };
                if (c.match(/^(\+|)[\d ]+$/))
                    return { href: "tel:" + c, text: c };
                else
                    return { text: c };
            });
        }
    }
}
</script>

<style scoped>
a {
    word-break: break-all;
    line-height: 1.5;
    height: 1.5em;
    overflow: hidden;
    display: -webkit-inline-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}
</style>