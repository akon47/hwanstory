<template>
  <app-header v-if="!isEmbed"/>
  <site-announcement v-if="!isEmbed && !isFullHeightRoute"/>
  <main class="content" :class="{ 'full-height': isFullHeightRoute }">
    <app-content/>
  </main>
  <app-footer v-if="!isFullHeightRoute && !isEmbed"/>
  <app-dialog-host/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppHeader from './components/common/AppHeader.vue';
import AppContent from './components/common/AppContent.vue';
import AppFooter from './components/common/AppFooter.vue';
import AppDialogHost from './components/common/AppDialogHost.vue';
import SiteAnnouncement from './components/common/SiteAnnouncement.vue';
import store from '@/store';
import blogWebSocketClient from '@/utils/websocket';

export default defineComponent({
  name: 'App',
  components: {
    AppHeader,
    AppContent,
    AppFooter,
    AppDialogHost,
    SiteAnnouncement,
  },
  computed: {
    theme() {
      return store.getters['commonStore/getTheme'];
    },
    // 글쓰기처럼 화면 전체를 쓰는 경로는 바닥글을 숨기고 남은 높이를 모두 준다.
    isFullHeightRoute(): boolean {
      return this.$route.path === '/write';
    },
    // 다른 사이트에 iframe 으로 넣는 카드 화면(?embed=1)은 헤더·바닥글 없이 내용만 보여준다.
    isEmbed(): boolean {
      return this.$route.query.embed === '1' || this.$route.query.embed === 'true';
    },
  },
  watch: {
    theme(value) {
      this.applyTheme(value);
    },
  },
  methods: {
    getMediaPreference() {
      const hasDarkPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return hasDarkPreference ? 'dark-theme' : 'light-theme';
    },
    applyTheme(value: string) {
      document.documentElement.className = value;
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute('content', value === 'dark-theme' ? '#0f1116' : '#f6f7fa');
    },
  },
  created() {
    // 저장된 테마가 없으면 기기 설정을 따른다.
    if (!this.theme) {
      store.commit('commonStore/setTheme', this.getMediaPreference());
    }
    this.applyTheme(this.theme);
    if (store.getters['accountStore/isLoggedIn']) {
      store.dispatch('accountStore/updateCurrentAccountInfo');
    }
    blogWebSocketClient.onsessioncountchanged = () => {
      store.dispatch('commonStore/updateSessionCount');
    };
    blogWebSocketClient.onpostviewercountschanged = () => {
      store.dispatch('commonStore/updatePostViewerCounts');
    };
  },
});
</script>

<style>
@import './css/reset.css';
@import './css/common.css';

.content {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.content.full-height {
  height: calc(100vh - var(--header-height));
  height: calc(100dvh - var(--header-height));
}
</style>
