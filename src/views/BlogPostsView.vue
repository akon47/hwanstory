<template>
  <div class="blog-posts">
    <div v-if="tag" class="filter-row">
      <span class="muted small">태그</span>
      <span class="chip">{{ tag }}</span>
      <router-link class="btn btn-ghost btn-sm" :to="`/${blogId}/posts`">
        <app-icon name="x" :size="14"/>필터 지우기
      </router-link>
    </div>
    <div v-if="!isLoading && isEmpty" class="empty-state">
      <div class="empty-icon"><app-icon name="file-text" :size="26"/></div>
      <div class="empty-title">{{ tag ? `'${tag}' 태그의 글이 없습니다` : '아직 쓴 글이 없습니다' }}</div>
      <router-link v-if="isMyBlog && !tag" class="btn" to="/write">
        <app-icon name="pen" :size="16"/>첫 글 쓰기
      </router-link>
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
import { getBlogAllPosts } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import store from '@/store';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'BlogPostsView',
  components: { AppIcon, LoadingSpinner, ObserverTrigger, SimplePostListPanel },
  props: {
    blogId: {
      type: String,
      required: true,
    },
    tag: {
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
      isEmpty: false,
    };
  },
  computed: {
    isMyBlog(): boolean {
      return this.blogId === store.state.accountStore.blogId;
    },
  },
  watch: {
    blogId() {
      this.fetchPosts();
    },
    tag() {
      this.fetchPosts();
    },
  },
  methods: {
    async fetchPosts(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        await getBlogAllPosts(this.blogId, this.tag ?? null, 20, cursorId)
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
.filter-row {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin-bottom: var(--s-2);
}

.loading {
  display: flex;
  justify-content: center;
  height: 64px;
}
</style>
