import {
  createRouter,
  createWebHashHistory,
  NavigationGuardWithThis,
} from 'vue-router';
import store from '@/store';
import { nextTick } from 'vue';

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
        title: '회원가입',
      },
    },
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/SigninView.vue'),
      beforeEnter: routeToMainWhenIsLoggedIn,
      meta: {
        title: '로그인',
      },
    },
    {
      path: '/write',
      name: 'Write',
      component: () => import('../views/WriteView.vue'),
      props: route => ({ postUrl: route.query.post }),
      meta: {
        title: '글 작성',
      },
    },
    {
      path: '/:blogId',
      component: () => import('../views/BlogView.vue'),
      props: true,
      children: [
        {
          path: '',
          component: () => import('@/components/posts/PostLoader.vue'),
          props: (route) => ({
            blogId: route.params.blogId,
            postUrl: 'about-me',
            defaultContent: '#### 소개 게시글이 존재하지 않습니다.',
          }),
        },
        {
          path: 'posts',
          component: () => import('../views/BlogPostsView.vue'),
          props: (route) => ({
            blogId: route.params.blogId,
          }),
        },
        {
          path: 'likes',
          component: () => import('../views/BlogLikesView.vue'),
          props: (route) => ({
            blogId: route.params.blogId,
          }),
        },
      ],
    },
    {
      path: '/:blogId/posts/:postUrl',
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
  scrollBehavior: (to, from, savedPosition) => {
    return {
      top: 0,
    };
  },
});

router.afterEach((to, from) => {
  const title = (to.meta?.title ? to.meta.title : 'Hwan\'Story') as string;

  nextTick((): any => {
    document.title = title;
  });
});

export default router;
