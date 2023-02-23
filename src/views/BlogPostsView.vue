<template>
  <div class="main-container">
    <div class="empty-message" v-if="!isLoading && isEmpty">
      작성한 게시글이 존재하지 않습니다.
    </div>
    <simple-post-list-panel :simple-posts="simplePosts"></simple-post-list-panel>
    <observer-trigger
        v-if="!isNoMorePage && !isLoading"
        class="observer-trigger-enable"
        v-on:trigger="loadMorePosts"/>
    <div class="loading" v-if="isLoading">
      <loading-spinner />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SimplePostListPanel from '@/components/posts/layout/SimplePostListPanel.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import { getBlogAllPosts } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

export default defineComponent({
  name: 'BlogPostsView',
  components: { LoadingSpinner, ObserverTrigger, SimplePostListPanel },
  props: {
    blogId: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: false,
    }
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
  },
  mounted() {
    this.fetchPosts();
  },
});
</script>

<style scoped>

.main-container {

}

.observer-trigger-enable {
  height: 680px;
  position: relative;
  margin-top: -600px;
}

.loading {
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  height: 80px;
}

.empty-message {
  text-align: center;
  font-size: 1.25em;
  font-weight: bold;
  padding-top: 2em;
}

</style>