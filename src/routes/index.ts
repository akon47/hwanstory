import {
  createRouter,
  createWebHistory,
  NavigationGuardWithThis,
} from 'vue-router';
import store from '@/store';
import { nextTick } from 'vue';
import { setCanonical, setJsonLd, setRobotsMeta } from '@/utils/seo';

// beforeEnter에 사용하여 로그인이 되어 있지 않으면 로그인 화면으로 보내고, 로그인 뒤 원래 화면으로 돌아오게 하는 함수
const routeToSigninWhenIsNotLoggedIn: NavigationGuardWithThis<undefined> = (to, from, next) => {
  if (store.getters['accountStore/isLoggedIn']) {
    next();
  } else {
    next({ path: '/signin', query: { redirect: to.fullPath } });
  }
};

// 검색엔진 색인에서 제외할 화면 (개인 화면·인증 화면·실시간 화면)
const NOINDEX_PATHS = [
  '/setting', '/bookmarks', '/search', '/signup', '/signin', '/write', '/feed', '/viewing', '/admin',
  '/social-authentication-redirect', '/reset-password', '/not-found', '/tokens', '/device',
];

// beforeEnter에 사용하여 로그인이 되어 있으면 메인 화면으로 보내는 함수
const routeToMainWhenIsLoggedIn: NavigationGuardWithThis<undefined> = (to, from, next) => {

  if (store.getters['accountStore/isLoggedIn']) {
    next('/');
  } else {
    next();
  }
};

// beforeEnter에 사용하여 관리자가 아니면 메인 화면으로 보내는 함수
const routeToMainWhenIsNotAdmin: NavigationGuardWithThis<undefined> = (to, from, next) => {
  if (store.getters['accountStore/isAdmin']) {
    next();
  } else {
    next('/');
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
        path: '/top',
        component: () => import('../views/MainView.vue'),
        props: (route) => ({
          sortBy: 'hits',
        }),
      },
      {
        path: '/viewing',
        component: () => import('../views/MainView.vue'),
        props: (route) => ({
          sortBy: 'viewing',
        }),
      },
      {
        path: '/search',
        name: 'Search',
        component: () => import('../views/MainView.vue'),
        props: (route) => ({
          isSearchMode: true,
          search: (route.query.q as string) || '',
        }),
        meta: {
          title: '검색',
        },
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
        path: '/bookmarks',
        name: 'Bookmarks',
        component: () => import('../views/BookmarksView.vue'),
        beforeEnter: (to, from, next) => {
          if (store.getters['accountStore/isLoggedIn']) {
            next();
          } else {
            next('/signin');
          }
        },
        meta: {
          title: '내 북마크',
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
              emptyMessage: '소개 게시글이 존재하지 않습니다.',
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
          {
            path: 'followers',
            component: () => import('../views/FollowListView.vue'),
            props: (route) => ({
              blogId: route.params.blogId,
              mode: 'followers',
            }),
          },
          {
            path: 'followings',
            component: () => import('../views/FollowListView.vue'),
            props: (route) => ({
              blogId: route.params.blogId,
              mode: 'followings',
            }),
          },
        ],
      },
      {
        path: '/feed',
        component: () => import('../views/FollowingFeedView.vue'),
        meta: {
          title: '팔로잉',
        },
      },
      {
        path: '/admin',
        name: 'Admin',
        component: () => import('../views/AdminView.vue'),
        beforeEnter: routeToMainWhenIsNotAdmin,
        meta: {
          title: '관리자',
        },
      },
      {
        path: '/admin/live',
        name: 'AdminLive',
        component: () => import('../views/AdminLiveView.vue'),
        beforeEnter: routeToMainWhenIsNotAdmin,
        meta: {
          title: '실시간 접속',
        },
      },
      {
        path: '/tokens',
        name: 'Tokens',
        component: () => import('../views/TokensView.vue'),
        beforeEnter: routeToSigninWhenIsNotLoggedIn,
        meta: {
          title: '액세스 토큰',
        },
      },
      {
        path: '/device',
        name: 'Device',
        component: () => import('../views/DeviceView.vue'),
        beforeEnter: routeToSigninWhenIsNotLoggedIn,
        meta: {
          title: '기기 로그인 승인',
        },
      },
      {
        path: '/agents',
        name: 'AgentGuide',
        component: () => import('../views/AgentGuideView.vue'),
        meta: {
          title: 'AI 에이전트 가이드',
        },
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

  // 검색엔진: 개인 화면은 색인 제외, 그 밖에는 경로 기준 canonical.
  // (게시글 화면은 글을 불러온 뒤 JSON-LD 와 비공개 여부를 추가로 설정한다)
  const noindex = NOINDEX_PATHS.some((path) => to.path === path || to.path.startsWith(`${path}/`));
  setRobotsMeta(noindex);
  setCanonical(noindex ? null : to.path);
  setJsonLd(null);
});

export default router;
