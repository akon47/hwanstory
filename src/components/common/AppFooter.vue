<template>
  <footer class="app-footer">
    <div class="container footer-inner">
      <div class="brand">
        <img class="logo-symbol" src="@/assets/logo-symbol.svg" alt=""/>
        <span>Hwan'Story</span>
        <span class="subtle">· 직접 만든 블로그 서비스</span>
      </div>
      <nav class="links" aria-label="바닥글">
        <router-link to="/agents">AI 에이전트 가이드</router-link>
        <a :href="rssUrl" target="_blank" rel="noopener">RSS</a>
        <router-link to="/privacy-policy">개인정보처리방침</router-link>
        <a href="mailto:akon47@naver.com">문의</a>
      </nav>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { serverUrl } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'AppFooter',
  computed: {
    rssUrl(): string {
      return `${serverUrl}rss`;
    },
  },
});
</script>

<style scoped>
.app-footer {
  border-top: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-3);
  font-size: var(--text-sm);
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-4);
  flex-wrap: wrap;
  padding-block: var(--s-6);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  color: var(--text-2);
  font-weight: 600;
}

.brand .subtle {
  font-weight: 400;
}

.logo-symbol {
  width: 22px;
  height: 22px;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-5);
}

.links a {
  color: var(--text-3);
}

.links a:hover {
  color: var(--text);
  text-decoration: none;
}

@media (max-width: 600px) {
  .brand .subtle {
    display: none;
  }
}
</style>
