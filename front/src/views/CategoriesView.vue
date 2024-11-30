<template>
  <section class="categories">
    <h1>🗂 Categories</h1>
    <article v-for="categorie in categories" class="categorie" @click="$router.push({name:'search',query:{c:categorie}})">
      <div class="banner" :style="`background-image:url('https://source.unsplash.com/featured/400x200?${categorie}')`"></div>
      <h2>{{ $text.get(categorie) }}</h2>
    </article>
  </section>
</template>

<script>
import EventsApi from '@/api';
export default {
  name: 'CategoriesView',
  setup() {
    return { EventsApi };
  },
  data() {
    return {
      categories: []
    };
  },
  mounted() {
    EventsApi.getCategories().then(categories => {
      this.categories = categories;
    });
  }
};
</script>

<style scoped lang="scss">
article {
  max-width: 1000px;
  margin: 10px auto 0;
  box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

section.categories {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1em;

  h1 {
    display: block;
    flex: 0 0 100%;
  }

  .categorie {
    flex: 1 0 20em;
    cursor: pointer;

    h2 {
      font-variant: all-small-caps;
    }
  }

  .banner {
    display: block;
    margin: auto;
    width: 100%;
    height: 200px;
    background: center center / cover #f4f4f4;
    border-radius: 4px;
  }
}
</style>