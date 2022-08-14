import { createRouter, createWebHashHistory, NavigationGuardWithThis } from 'vue-router';
import store from '@/store';
import { nextTick } from "vue";

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
      meta: {
        title: '회원가입'
      }
    },
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/SigninView.vue'),
      beforeEnter: routeToMainWhenIsLoggedIn,
      meta: {
        title: '로그인'
      }
    },
    {
      path: '/write',
      name: 'Write',
      component: () => import('../views/WriteView.vue'),
      meta: {
        title: '새 글 작성'
      }
    },
    {
      path: '/:blogId',
      component: () => import('../views/BlogView.vue'),
      props: true,
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

router.afterEach((to, from) => {
  const title = (to.meta?.title ? to.meta.title : 'Hwan\'Story') as string;

  nextTick((): any => {
    document.title = title;
  });
});

export default router;
