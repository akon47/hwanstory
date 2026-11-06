<template>
  <div class="guide-container">
    <div class="guide-head">
      <h1>AI 에이전트 가이드</h1>
      <p class="lead">
        AI 에이전트에게 블로그 글쓰기·검토를 맡길 때 에이전트가 읽는 문서입니다. 원문(마크다운)은
        <a :href="guideUrl" target="_blank" rel="noopener">{{ guideUrl }}</a> 에 있고, 에이전트에게는 이 주소를 주면 됩니다.
        토큰은 <router-link to="/tokens">액세스 토큰</router-link> 화면에서 관리합니다.
      </p>
    </div>
    <div v-if="isLoading" class="loading">
      <loading-spinner/>
    </div>
    <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>
    <article v-else class="markdown" v-html="html"></article>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { marked } from 'marked';
import { serverUrl } from '@/api/common/httpApiClient';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

export default defineComponent({
  name: 'AgentGuideView',
  components: { LoadingSpinner },
  data() {
    return {
      html: '',
      errorMessage: '',
      isLoading: true,
    };
  },
  computed: {
    guideUrl(): string {
      return `${(serverUrl as string).replace(/\/+$/, '')}/agents.md`;
    },
  },
  async created() {
    try {
      const response = await fetch(this.guideUrl, { headers: { Accept: 'text/markdown, text/plain' } });
      if (!response.ok) {
        throw new Error(`가이드를 불러오지 못했습니다. (${response.status})`);
      }
      // 우리 API 서버가 만든 문서이므로 그대로 렌더링한다.
      this.html = marked.parse(await response.text()) as string;
    } catch (e) {
      this.errorMessage = (e as Error).message;
    } finally {
      this.isLoading = false;
    }
  },
});
</script>

<style scoped>

.guide-container {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--base-gap);
  box-sizing: border-box;
}

.guide-head h1 {
  font-size: 1.8em;
  margin-bottom: 0.25em;
}

.lead {
  font-weight: 300;
  color: #8e9297;
  line-height: 1.6;
  word-break: break-all;
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--base-gap);
}

.error {
  color: var(--button-red-color);
  padding: var(--base-gap) 0;
}

.markdown {
  margin-top: var(--base-gap);
  line-height: 1.75;
  word-break: break-word;
}

.markdown :deep(h1) {
  display: none; /* 페이지 제목과 중복 */
}

.markdown :deep(h2) {
  font-size: 1.5em;
  margin: 2em 0 0.6em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--border-color);
}

.markdown :deep(h3) {
  font-size: 1.2em;
  margin: 1.6em 0 0.5em;
}

.markdown :deep(p),
.markdown :deep(ul),
.markdown :deep(ol) {
  margin: 0.6em 0;
}

.markdown :deep(ul),
.markdown :deep(ol) {
  padding-left: 1.6em;
}

.markdown :deep(ul) {
  list-style: disc;
}

.markdown :deep(ol) {
  list-style: decimal;
}

.markdown :deep(blockquote) {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid var(--link-accent-color);
  background-color: var(--content-item-background-color);
  color: var(--base-color);
}

.markdown :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.88em;
  background-color: var(--content-item-background-color);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.1em 0.35em;
}

.markdown :deep(pre) {
  background-color: var(--content-item-background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);
  padding: 0.9em 1em;
  overflow-x: auto;
  margin: 0.8em 0;
}

.markdown :deep(pre code) {
  border: none;
  padding: 0;
  background: none;
  font-size: 0.85em;
  line-height: 1.55;
}

.markdown :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8em 0;
  font-size: 0.92em;
  display: block;
  overflow-x: auto;
}

.markdown :deep(th),
.markdown :deep(td) {
  border: 1px solid var(--border-color);
  padding: 0.45em 0.7em;
  text-align: left;
  vertical-align: top;
}

.markdown :deep(th) {
  background-color: var(--content-item-background-color);
}

.markdown :deep(a) {
  color: var(--link-accent-color);
}

</style>
