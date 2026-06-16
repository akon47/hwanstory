<template>
  <div class="main-container">
    <div class="tabs-container">
      <div class="tabs">
        <router-link :to="{path: `/`}">
          최근 글
        </router-link>
        <router-link :to="{path: `/top`}">
          인기 글
        </router-link>
        <router-link :to="{path: `/viewing`}">
          보고 있는 글
        </router-link>
        <router-link v-if="isLoggedIn" :to="{path: `/feed`}">
          팔로잉
        </router-link>
      </div>
    </div>
    <simple-post-wrap-panel :simple-posts="simplePosts"></simple-post-wrap-panel>
    <div v-if="isViewingMode && simplePosts.length === 0 && !isLoading" class="empty-viewing">
      지금 보고 있는 글이 없습니다.
    </div>
    <observer-trigger
        v-if="!isViewingMode && !this.isNoMorePage && !isLoading"
        class="observer-trigger-enable"
        v-on:trigger="loadMorePosts"/>
    <div class="loading" v-if="isLoading">
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
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import store from '@/store';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

export default defineComponent({
  name: 'MainView',
  components: { LoadingSpinner, ObserverTrigger, SimplePostWrapPanel },
  props: {
    sortBy: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      simplePosts: Array<SimplePostDto>(),
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
      viewingRefreshTimer: null as ReturnType<typeof setTimeout> | null,
    };
  },
  computed: {
    cachedMainPosts() {
      return store.getters['cacheStore/getCachedMainPosts'];
    },
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    // "보고 있는 글" 탭 여부
    isViewingMode(): boolean {
      return this.sortBy === 'viewing';
    },
    // 게시글별 실시간 시청자 수 맵 (변경될 때마다 새 객체로 교체되어 watch가 동작한다)
    viewerCounts() {
      return store.getters['commonStore/postViewerCounts'];
    },
  },
  watch: {
    cachedMainPosts(value) {
      if (!this.isViewingMode && value === null) {
        this.refresh();
      }
    },
    sortBy() {
      this.refresh();
    },
    viewerCounts() {
      // 시청자 수가 바뀌면(누군가 글을 보기 시작/종료) 보고 있는 글 목록을 디바운스 후 갱신한다.
      if (!this.isViewingMode) {
        return;
      }
      if (this.viewingRefreshTimer) {
        clearTimeout(this.viewingRefreshTimer);
      }
      this.viewingRefreshTimer = setTimeout(() => this.fetchViewingPosts(), 800);
    },
  },
  methods: {
    async refresh() {
      await this.fetchPosts();
    },
    async fetchPosts(cursorId: string | null = null) {
      if (this.isViewingMode) {
        await this.fetchViewingPosts();
        return;
      }
      try {
        this.isLoading = true;
        await getAllPosts(20, cursorId, this.sortBy)
        .then(async (posts) => {
          if (posts.first) {
            this.simplePosts = posts.data;
          } else {
            posts.data.forEach((post) => {
              this.simplePosts.push(post);
            });
          }
          this.cursorId = (!posts.last && posts.cursorId) ? posts.cursorId : '';
          this.isNoMorePage = posts.last;

          await store.dispatch('cacheStore/setMainPosts', {
            simplePosts: this.simplePosts,
            cursorId: this.cursorId,
            isNoMorePage: this.isNoMorePage,
          });
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      } finally {
        this.isLoading = false;
      }
    },
    async loadMorePosts() {
      if (this.cursorId) {
        await this.fetchPosts(this.cursorId);
      }
    },
    // 현재 한 명 이상이 보고 있는 공개 게시글을 조회한다. (캐시/페이징 미사용)
    async fetchViewingPosts() {
      try {
        this.isLoading = true;
        this.simplePosts = await getViewingPosts();
        this.cursorId = '';
        this.isNoMorePage = true;
      } catch (error) {
        // 목록 조회 실패는 빈 목록으로 둔다.
      } finally {
        this.isLoading = false;
      }
    },
  },
  mounted() {
    if (this.isViewingMode) {
      this.fetchViewingPosts();
      return;
    }
    const cachedMainPosts = store.getters['cacheStore/getCachedMainPosts'];
    if (cachedMainPosts == null) {
      this.fetchPosts();
    } else {
      this.simplePosts = cachedMainPosts.simplePosts;
      this.cursorId = cachedMainPosts.cursorId;
      this.isNoMorePage = cachedMainPosts.isNoMorePage;
    }
  },
  beforeUnmount() {
    if (this.viewingRefreshTimer) {
      clearTimeout(this.viewingRefreshTimer);
    }
  },
});
</script>

<style scoped>

.main-container {
  min-height: 100vh;
}

.observer-trigger-enable {
  height: 720px;
  position: relative;
  margin-top: -600px;
}

.loading {
  display: flex;
  justify-content: center;
  margin-bottom: calc(var(--base-gap) * 2);
  box-sizing: border-box;
  height: 80px;
}

.tabs-container {
  display: grid;

  grid-template-columns: repeat(auto-fill, 320px);
  grid-template-rows: auto;

  gap: calc(var(--base-gap) * 2);
  margin-left: calc(var(--base-gap) * 2);
  margin-right: calc(var(--base-gap) * 2);

  justify-content: center;
}

@media (max-width: 1080px) {
  .tabs-container {
    grid-template-columns: repeat(2, 1fr);
    justify-content: center;

    gap: var(--base-gap);
    margin-left: var(--base-gap);
    margin-right: var(--base-gap);
  }
}

@media (max-width: 650px) {
  .tabs-container {
    grid-template-columns: repeat(1, 1fr);
    justify-content: stretch;
  }
}

.tabs {
  border-bottom: 1px solid var(--border-color);

  grid-column: 1/-1;

  display: flex;
  flex-wrap: wrap;

  gap: var(--base-gap);

  justify-content: left;
}

.empty-viewing {
  display: flex;
  justify-content: center;
  align-items: center;

  min-height: 200px;
  opacity: 0.6;
}

.tabs a {
  color: var(--base-color);
  opacity: 0.5;
  box-sizing: border-box;
  text-align: center;
  align-self: stretch;
  padding: 12px 8px 5px 8px;
  border-bottom: 2px solid transparent;

  transition: 0.2s;
}

@media (hover: hover) and (pointer: fine) {
  .tabs a:hover {
    text-decoration: none;
    opacity: 1;
    border-bottom: 2px solid var(--base-color);
  }
}

.tabs a.router-link-exact-active {
  color: var(--base-color);
  opacity: 1;
  border-bottom: 2px solid var(--button-color);
}

</style>