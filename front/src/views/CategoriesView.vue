<template>
  <section class="categories">
    <h1>🗂 {{ $text.get('categories') }}</h1>
    <article v-for="categorie in categories" class="categorie" @click="$router.push({name:'search',query:{c:categorie.id}})">
      <div class="banner" :style="`background-image:url('${categorie.image}')`"></div>
      <h2>{{ categorie.emoji }} {{ $text.get(categorie.id) }}</h2>
    </article>
  </section>
</template>

<script>
export default {
  name: 'CategoriesView',
  data() {
    return {
      categories: []
    };
  },
  mounted() {
    this.$api.getCategories().then(categories => {
      this.categories = categories;
    });
  }
};
</script>

<style scoped lang="scss">
section.categories {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1em;

  h1 {
    display: block;
    flex: 0 0 100%;
  }

  .categorie {
    flex: 1 0 20em;
    max-width: 1000px;
    cursor: pointer;
    @include interactive;

    h2 {
      font-variant: all-small-caps;
    }
  }

  .banner {
    display: block;
    margin: auto;
    width: 100%;
    height: 200px;
    background: center center / cover var(--color-background-mute);
    border-radius: 4px;
  }
}
</style>