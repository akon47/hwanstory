<template>
  <div class="main-container">
    <div class="tabs-container">
      <div class="tabs">
        <router-link :to="{path: `/`}">최근 글</router-link>
        <router-link :to="{path: `/top`}">인기 글</router-link>
        <router-link :to="{path: `/viewing`}">보고 있는 글</router-link>
        <router-link :to="{path: `/feed`}">팔로잉</router-link>
      </div>
    </div>
    <simple-post-wrap-panel :simple-posts="simplePosts"></simple-post-wrap-panel>
    <div v-if="isEmpty && !isLoading" class="empty-message">
      팔로우하는 사용자의 게시글이 없습니다.
    </div>
    <observer-trigger
        v-if="!isNoMorePage && !isLoading"
        class="observer-trigger-enable"
        v-on:trigger="loadMore"/>
    <div class="loading" v-if="isLoading">
      <loading-spinner/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import { getFollowingFeed } from '@/api/follow';
import { HttpApiError } from '@/api/common/httpApiClient';
import SimplePostWrapPanel from '@/components/posts/layout/SimplePostWrapPanel.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

export default defineComponent({
  name: 'FollowingFeedView',
  components: { LoadingSpinner, ObserverTrigger, SimplePostWrapPanel },
  data() {
    return {
      simplePosts: Array<SimplePostDto>(),
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
      isEmpty: false,
    };
  },
  methods: {
    async fetch(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        await getFollowingFeed(20, cursorId)
        .then((posts) => {
          if (posts.first) {
            this.simplePosts = posts.data;
          } else {
            posts.data.forEach((post) => {
              this.simplePosts.push(post);
            });
          }
          this.cursorId = (!posts.last && posts.cursorId) ? posts.cursorId : '';
          this.isNoMorePage = posts.last;
          this.isEmpty = posts.last && this.simplePosts.length === 0;
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      } finally {
        this.isLoading = false;
      }
    },
    async loadMore() {
      if (this.cursorId) {
        await this.fetch(this.cursorId);
      }
    },
  },
  mounted() {
    this.fetch();
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

.empty-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  opacity: 0.6;
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
  display: grid;
  grid-template-columns: repeat(4, auto);
  grid-template-rows: auto;
  gap: var(--base-gap);
  justify-content: left;
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
