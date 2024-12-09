import { createRouter, createWebHistory } from 'vue-router';
import Texts from '@/texts';
import { baseUrl } from '@/config';

const createMainRouter = async () => {
  
  await Texts.init(["fr-FR", "en-GB", "en-US"]);

  var router = createRouter({
    base: "./",
    history: createWebHistory(baseUrl),
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
        path: "/me/fav",
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
        path: "/me/orga",
        name: "orga",
        component: () => import("../views/OrganizeView.vue"),
        meta: {
          title: Texts.get('orga')
        }
      },
      {
        path: "/categories",
        name: "categories",
        component: () => import("../views/CategoriesView.vue"),
        meta: {
          title: Texts.get('categories')
        }
      },
      {
        path: "/login",
        name: "login",
        component: () => import("../views/LoginView.vue"),
        meta: {
          title: Texts.get('login')
        }
      }
    ]
  });

  router.beforeEach((to, from, next) => {
    document.title = to.meta.title + ' - Events';
    next();
  });

  return router;

};

export default createMainRouter;
