<template>
  <div class="main-container">
    <simple-post-list-panel :simple-posts="simplePosts"></simple-post-list-panel>
    <observer-trigger
        class="observer-trigger-enable"
        :class="{'observer-trigger-disable': this.isNoMorePage}"
        v-on:trigger="loadMorePosts"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SimplePostListPanel from '@/components/posts/layout/SimplePostListPanel.vue';
import ObserverTrigger from '@/components/common/ObserverTrigger.vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import { getBlogAllPosts } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'BlogPostsView',
  components: { ObserverTrigger, SimplePostListPanel },
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
      isNoMorePage: false,
    };
  },
  methods: {
    async fetchPosts(cursorId: string | null = null) {
      await getBlogAllPosts(this.blogId, 20, cursorId)
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
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
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
  min-height: 100vh;
}

.observer-trigger-enable {
  height: 900px;
  position: relative;
  margin-top: -600px;
}

.observer-trigger-disable {
  height: 0px;
  margin-top: 0px;
  position: relative;
}

</style>