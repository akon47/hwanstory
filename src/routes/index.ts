import {
  createRouter,
  createWebHistory,
  NavigationGuardWithThis,
} from 'vue-router';
import store from '@/store';
import { nextTick } from 'vue';

// beforeEnter에 사용하여 로그인이 되어 있으면 메인 화면으로 보내는 함수
const routeToMainWhenIsLoggedIn: NavigationGuardWithThis<undefined> = (to, from, next) => {

  if (store.getters['accountStore/isLoggedIn']) {
    next('/');
  } else {
    next();
  }
};

const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'Main',
        component: () => import('../views/MainView.vue'),
      },
      {
        path: '/setting',
        name: 'Setting',
        component: () => import('../views/SettingView.vue'),
        meta: {
          title: '설정',
        },
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
              tag: route.query.tag as string,
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
        path: '/social-authentication-redirect',
        name: 'SocialAuthenticationRedirect',
        component: () => import('../views/SocialAuthenticationRedirectView.vue'),
        props: (route) => ({
          needRegister: JSON.parse(route.query.needRegister as string),
          accessToken: route.query.accessToken,
          refreshToken: route.query.refreshToken,
          registerToken: route.query.registerToken,
          email: route.query.email,
          name: route.query.name,
          profileImageUrl: route.query.profileImageUrl,
        }),
      },
      {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('../views/ResetPasswordView.vue'),
        beforeEnter: (to, from, next) => {
          if (to.query.token) {
            next();
          } else {
            next('/');
          }
        },
        props: (route) => ({
          token: route.query.token as string,
        }),
        meta: {
          title: '비밀번호 재설정',
        },
      },
      {
        path: '/privacy-policy',
        name: 'PrivacyPolicy',
        component: () => import('../views/PrivacyPolicyView.vue'),
        meta: {
          title: '개인정보처리방침',
        },
      },
      {
        path: '/not-found',
        name: 'NotFound',
        component: () => import('../views/NotFoundView.vue'),
        meta: {
          title: '페이지를 찾을 수 없습니다.',
        },
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: 'not-found',
      },
    ],
    scrollBehavior: (to, from, savedPosition) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (savedPosition) {
            resolve(savedPosition);
          } else {
            return resolve({ left: 0, top: 0 });
          }
        }, 200);
      });
    },
  })
;

router.afterEach((to, from) => {
  const title = (to.meta?.title ? to.meta.title : 'Hwan\'Story') as string;
  nextTick((): any => {
    document.title = title;
  });
});

export default router;
