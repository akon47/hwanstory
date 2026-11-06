<template>
  <div class="blog-likes">
    <div v-if="!isLoading && isEmpty" class="empty-state">
      <div class="empty-icon"><app-icon name="heart" :size="26"/></div>
      <div class="empty-title">좋아요 한 글이 없습니다</div>
      <div>글 아래의 <b>좋아요</b>를 누르면 여기에 모입니다.</div>
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
import { getBloggerLikePosts } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'BlogLikesView',
  components: { AppIcon, LoadingSpinner, ObserverTrigger, SimplePostListPanel },
  props: {
    blogId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      simplePosts: Array<SimplePostDto>(),
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
      isEmpty: false,
    };
  },
  watch: {
    blogId() {
      this.fetchPosts();
    },
  },
  methods: {
    async fetchPosts(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        await getBloggerLikePosts(this.blogId, 20, cursorId)
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
