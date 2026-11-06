<template>
  <div class="container page feed-page">
    <feed-tabs/>
    <simple-post-wrap-panel :simple-posts="simplePosts"/>
    <div v-if="isEmpty && !isLoading" class="empty-state">
      <div class="empty-icon"><app-icon name="users" :size="26"/></div>
      <div class="empty-title">팔로우하는 사람의 새 글이 없습니다</div>
      <div>마음에 드는 글쓴이의 블로그에서 <b>팔로우</b>를 누르면 여기에서 새 글을 모아 볼 수 있어요.</div>
      <router-link class="btn btn-secondary" to="/">최근 글 보기</router-link>
    </div>
    <observer-trigger v-if="!isNoMorePage && !isLoading" @trigger="loadMore"/>
    <div v-if="isLoading" class="loading">
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
import FeedTabs from '@/components/posts/layout/FeedTabs.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'FollowingFeedView',
  components: { AppIcon, LoadingSpinner, ObserverTrigger, SimplePostWrapPanel, FeedTabs },
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
          toast.error(error.getErrorMessage());
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
.feed-page {
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
</style>
