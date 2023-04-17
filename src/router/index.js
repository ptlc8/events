import { createRouter, createWebHistory } from 'vue-router';
import Texts from '../texts.js';

const router = createRouter({
  base: "./",
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'map',
      component: () => import('../views/MapView.vue'),
      meta: {
        title: Texts.get('map')
      }
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      meta: {
        title: Texts.get('search')
      }
    },
    {
      path: "/fav",
      name: "fav",
      component: () => import("../views/FavoritesView.vue"),
      meta: {
        title: Texts.get('fav')
      }
    },
    {
      path: "/map",
      redirect: "/"
    },
    {
      path: "/me",
      name: "me",
      component: () => import("../views/MeView.vue"),
      meta: {
        title: Texts.get('me')
      }
    },
    {
      path: "/orga",
      name: "orga",
      component: () => import("../views/OrganizeView.vue"),
      meta: {
        title: Texts.get('orga')
      }
    }
  ]
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title + ' - Events';
  next();
});

export default router;
