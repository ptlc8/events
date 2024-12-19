import { createRouter, createWebHistory } from 'vue-router';
import { get as T, init as initTexts } from '@/texts';
import { baseUrl } from '@/config';

const createMainRouter = async () => {
  
  await initTexts(["fr-FR", "en-GB", "en-US"]);

  var router = createRouter({
    base: "./",
    history: createWebHistory(baseUrl),
    routes: [
      {
        path: '/',
        name: 'map',
        component: () => import('../views/MapView.vue'),
        meta: {
          title: T('map')
        }
      },
      {
        path: '/search',
        name: 'search',
        component: () => import('../views/SearchView.vue'),
        meta: {
          title: T('search')
        }
      },
      {
        path: "/me/fav",
        name: "fav",
        component: () => import("../views/FavoritesView.vue"),
        meta: {
          title: T('fav')
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
          title: T('me')
        }
      },
      {
        path: "/me/orga",
        name: "orga",
        component: () => import("../views/OrganizeView.vue"),
        meta: {
          title: T('orga')
        }
      },
      {
        path: "/categories",
        name: "categories",
        component: () => import("../views/CategoriesView.vue"),
        meta: {
          title: T('categories')
        }
      },
      {
        path: "/login",
        name: "login",
        component: () => import("../views/LoginView.vue"),
        meta: {
          title: T('login')
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
