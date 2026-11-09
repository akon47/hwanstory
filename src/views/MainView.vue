<template>
  <div class="container page main-page">
    <template v-if="isSearchMode">
      <form class="search-head" @submit.prevent="submitSearch">
        <h1>검색</h1>
        <div class="search-box">
          <app-icon class="search-icon" name="search" :size="20"/>
          <input ref="search-input" class="input search-input" type="search" v-model="keyword" placeholder="제목·내용으로 글 찾기"
                 aria-label="검색어" autocomplete="off"/>
          <button class="btn" type="submit" :disabled="!keyword.trim()">검색</button>
        </div>
        <p v-if="search" class="muted">
          <b>‘{{ search }}’</b> 검색 결과 <span v-if="!isLoading && isNoMorePage">{{ simplePosts.length }}개</span>
        </p>
      </form>
    </template>
    <feed-tabs v-else/>

    <div v-if="isViewingMode && !isLoading" class="viewing-note subtle small">
      <app-icon name="radio" :size="14"/>지금 누군가 읽고 있는 글입니다. 사람이 많은 순으로 보여요.
    </div>

    <simple-post-wrap-panel :simple-posts="simplePosts"/>

    <div v-if="!isLoading && simplePosts.length === 0" class="empty-state">
      <div class="empty-icon"><app-icon :name="isSearchMode ? 'search' : 'inbox'" :size="26"/></div>
      <template v-if="isSearchMode && !search">
        <div class="empty-title">찾고 싶은 글의 단어를 입력하세요</div>
        <div>제목과 내용에서 찾습니다.</div>
      </template>
      <template v-else-if="isSearchMode">
        <div class="empty-title">‘{{ search }}’에 맞는 글이 없습니다</div>
        <div>다른 단어로 다시 찾아보세요.</div>
      </template>
      <template v-else-if="isViewingMode">
        <div class="empty-title">지금 읽고 있는 사람이 없습니다</div>
        <div>누군가 글을 열면 여기에 바로 나타납니다.</div>
      </template>
      <template v-else>
        <div class="empty-title">아직 글이 없습니다</div>
      </template>
    </div>

    <observer-trigger v-if="!isViewingMode && !isNoMorePage && !isLoading" @trigger="loadMorePosts"/>
    <div v-if="isLoading" class="loading">
      <loading-spinner/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import { getAllPosts, getViewingPosts } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import SimplePostWrapPanel from '@/components/posts/layout/SimplePostWrapPanel.vue';
import FeedTabs from '@/components/posts/layout/FeedTabs.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import store from '@/store';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'MainView',
  components: { AppIcon, LoadingSpinner, ObserverTrigger, SimplePostWrapPanel, FeedTabs },
  props: {
    sortBy: {
      type: String,
      required: false,
    },
    // 검색어 (검색 화면 /search?q=)
    search: {
      type: String,
      required: false,
    },
    isSearchMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      simplePosts: Array<SimplePostDto>(),
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
      keyword: this.search ?? '',
      viewingRefreshTimer: null as ReturnType<typeof setTimeout> | null,
      // 가장 최근에 보낸 목록 요청 번호. 늦게 도착한 이전 요청의 응답을 가려낸다.
      fetchRequestId: 0,
      // 화면의 "지금 보는 중" 목록을 받았을 때의 시청자 수 요약
      loadedViewingSignature: null as string | null,
    };
  },
  computed: {
    cachedMainPosts() {
      return store.getters['cacheStore/getCachedMainPosts'];
    },
    // "지금 보는 중" 탭 여부
    isViewingMode(): boolean {
      return this.sortBy === 'viewing';
    },
    // 메인 첫 화면(최근 글)만 캐시한다.
    isCacheable(): boolean {
      return !this.isViewingMode && !this.isSearchMode && !this.sortBy;
    },
    // 게시글별 실시간 시청자 수 맵 (변경될 때마다 새 객체로 교체되어 watch가 동작한다)
    viewerCounts() {
      return store.getters['commonStore/postViewerCounts'];
    },
  },
  watch: {
    cachedMainPosts(value) {
      if (this.isCacheable && value === null) {
        this.refresh();
      }
    },
    sortBy() {
      // 탭을 옮기면 "지금 보는 중" 탭에서 예약해 둔 목록 갱신은 버린다.
      this.clearViewingRefreshTimer();
      this.refresh();
    },
    search(value) {
      this.keyword = value ?? '';
      this.refresh();
    },
    viewerCounts() {
      // 시청자 수가 바뀌면(누군가 글을 보기 시작/종료) 보고 있는 글 목록을 디바운스 후 갱신한다.
      if (!this.isViewingMode) {
        return;
      }
      this.clearViewingRefreshTimer();
      this.viewingRefreshTimer = setTimeout(() => {
        this.viewingRefreshTimer = null;
        // 화면에 있는 목록을 받은 뒤로 읽는 사람 수가 그대로면 다시 받을 필요가 없다.
        // (탭에 들어온 직후 카드들이 시청자 수를 받아 오면서 생기는 변경 알림이 여기에 해당한다)
        if (this.isViewingMode && this.viewingSignature() !== this.loadedViewingSignature) {
          // 이미 목록이 보이는 상태의 갱신이므로 로딩 표시 없이 조용히 바꾼다.
          this.fetchViewingPosts(true);
        }
      }, 800);
    },
  },
  methods: {
    // 지금 읽히고 있는 글과 사람 수를 한 줄로 요약한다. (목록을 다시 받아야 하는지 비교하는 데 쓴다)
    viewingSignature(): string {
      const counts = (this.viewerCounts ?? {}) as Record<string, number>;
      return Object.keys(counts)
      .filter((postId) => counts[postId] > 0)
      .sort()
      .map((postId) => `${postId}:${counts[postId]}`)
      .join(',');
    },
    clearViewingRefreshTimer() {
      if (this.viewingRefreshTimer) {
        clearTimeout(this.viewingRefreshTimer);
        this.viewingRefreshTimer = null;
      }
    },
    async refresh() {
      await this.fetchPosts();
    },
    submitSearch() {
      const q = this.keyword.trim();
      if (q) {
        this.$router.push({ path: '/search', query: { q } });
      }
    },
    async fetchPosts(cursorId: string | null = null) {
      if (this.isViewingMode) {
        await this.fetchViewingPosts();
        return;
      }
      if (this.isSearchMode && !this.search) {
        this.simplePosts = [];
        this.isNoMorePage = true;
        return;
      }
      const requestId = ++this.fetchRequestId;
      try {
        this.isLoading = true;
        await getAllPosts(20, cursorId, this.sortBy ?? null, this.isSearchMode ? this.search ?? null : null)
        .then(async (posts) => {
          // 응답을 기다리는 사이 탭·검색어가 바뀌었으면 늦게 온 응답은 버린다.
          if (requestId !== this.fetchRequestId) {
            return;
          }
          if (posts.first) {
            this.simplePosts = posts.data;
          } else {
            posts.data.forEach((post) => {
              this.simplePosts.push(post);
            });
          }
          this.cursorId = (!posts.last && posts.cursorId) ? posts.cursorId : '';
          this.isNoMorePage = posts.last;

          if (this.isCacheable) {
            await store.dispatch('cacheStore/setMainPosts', {
              simplePosts: this.simplePosts,
              cursorId: this.cursorId,
              isNoMorePage: this.isNoMorePage,
            });
          }
        })
        .catch((error: HttpApiError) => {
          if (requestId === this.fetchRequestId) {
            toast.error(error.getErrorMessage());
          }
        });
      } finally {
        if (requestId === this.fetchRequestId) {
          this.isLoading = false;
        }
      }
    },
    async loadMorePosts() {
      if (this.cursorId) {
        await this.fetchPosts(this.cursorId);
      }
    },
    // 현재 한 명 이상이 보고 있는 공개 게시글을 조회한다. (캐시/페이징 미사용)
    async fetchViewingPosts(silent = false) {
      const requestId = ++this.fetchRequestId;
      try {
        if (!silent) {
          this.isLoading = true;
        }
        const posts = await getViewingPosts();
        // 응답을 기다리는 사이 다른 탭으로 옮겼으면 그 탭의 목록을 덮어쓰지 않는다.
        if (requestId !== this.fetchRequestId) {
          return;
        }
        this.simplePosts = posts;
        this.cursorId = '';
        this.isNoMorePage = true;
        this.loadedViewingSignature = this.viewingSignature();
      } catch (error) {
        // 목록 조회 실패는 빈 목록으로 둔다.
      } finally {
        if (requestId === this.fetchRequestId) {
          this.isLoading = false;
        }
      }
    },
  },
  mounted() {
    if (this.isViewingMode) {
      this.fetchViewingPosts();
      return;
    }
    if (this.isSearchMode) {
      this.fetchPosts();
      if (!this.search) {
        (this.$refs['search-input'] as HTMLInputElement | undefined)?.focus();
      }
      return;
    }
    const cachedMainPosts = store.getters['cacheStore/getCachedMainPosts'];
    if (!this.isCacheable || cachedMainPosts == null) {
      this.fetchPosts();
    } else {
      this.simplePosts = cachedMainPosts.simplePosts;
      this.cursorId = cachedMainPosts.cursorId;
      this.isNoMorePage = cachedMainPosts.isNoMorePage;
    }
  },
  beforeUnmount() {
    this.clearViewingRefreshTimer();
  },
});
</script>

<style scoped>
.main-page {
  display: grid;
  gap: var(--s-6);
  align-content: start;
  min-height: 60vh;
  padding-block: var(--s-5) var(--s-16);
}

.loading {
  display: flex;
  justify-content: center;
  height: 64px;
}

.viewing-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: calc(var(--s-4) * -1);
}

.search-head {
  display: grid;
  gap: var(--s-3);
}

.search-head h1 {
  font-size: var(--text-2xl);
}

.search-box {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-2);
  max-width: 640px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}

.search-input {
  min-height: 46px;
  padding-left: 44px;
  font-size: var(--text-md);
}

.search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}

.search-box .btn {
  height: 46px;
}
</style>
