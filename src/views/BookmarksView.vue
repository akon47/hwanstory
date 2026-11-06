<template>
  <div class="container container-narrow page">
    <div class="page-head">
      <div>
        <h1>북마크</h1>
        <p class="lead">나중에 다시 읽으려고 저장한 글입니다.</p>
      </div>
    </div>
    <div v-if="!isLoading && isEmpty" class="empty-state">
      <div class="empty-icon"><app-icon name="bookmark" :size="26"/></div>
      <div class="empty-title">저장한 글이 없습니다</div>
      <div>글 아래의 <b>북마크</b>를 누르면 여기에 모입니다.</div>
      <router-link class="btn btn-secondary" to="/">글 둘러보기</router-link>
    </div>
    <simple-post-list-panel :simple-posts="simplePosts"/>
    <observer-trigger v-if="!isNoMorePage && !isLoading" @trigger="loadMorePosts"/>
    <div v-if="isLoading" class="loading">
      <loading-spinner/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SimplePostListPanel from '@/components/posts/layout/SimplePostListPanel.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import { getMyBookmarks } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'BookmarksView',
  components: { AppIcon, LoadingSpinner, ObserverTrigger, SimplePostListPanel },
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
    async fetchPosts(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        await getMyBookmarks(20, cursorId)
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
    async loadMorePosts() {
      if (this.cursorId) {
        await this.fetchPosts(this.cursorId);
      }
    },
  },
  mounted() {
    this.fetchPosts();
  },
});
</script>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  height: 64px;
}
</style>
