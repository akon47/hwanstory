import { createRouter, createWebHashHistory, NavigationGuardWithThis } from 'vue-router';
import store from '@/store';

// beforeEnter에 사용하여 로그인이 되어 있으면 메인 화면으로 보내는 함수
const routeToMainWhenIsLoggedIn: NavigationGuardWithThis<undefined> = (to, from, next) => {

  if (store.getters['accountStore/isLoggedIn']) {
    next('/main');
  } else {
    next();
  }
};

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/main',
    },
    {
      path: '/main',
      name: 'Main',
      component: () => import('../views/MainView.vue'),
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/SignupView.vue'),
      beforeEnter: routeToMainWhenIsLoggedIn,
    },
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/SigninView.vue'),
      beforeEnter: routeToMainWhenIsLoggedIn,
    },
    {
      path: '/write',
      name: 'Write',
      component: () => import('../views/WriteView.vue'),
    },
    {
      path: '/:blogId/:postUrl',
      component: () => import('../views/PostView.vue'),
      props: true,
    },
    {
      path: '/not-found',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: 'not-found',
    },
  ],
});

export default router;
