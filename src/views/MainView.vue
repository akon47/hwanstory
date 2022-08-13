<template>
  <div class="main-container">
    <simple-post-wrap-panel :simple-posts="simplePosts"></simple-post-wrap-panel>
    <observer-trigger
        :class="{'observer-trigger-enable': !this.isNoMorePage, 'observer-trigger-disable': this.isNoMorePage}"
        v-on:trigger="loadMorePosts" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import { getAllPosts } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import SimplePostWrapPanel from "@/components/posts/SimplePostWrapPanel.vue";
import ObserverTrigger from "@/components/common/ObserverTrigger.vue";

export default defineComponent({
  name: 'MainView',
  components: { ObserverTrigger, SimplePostWrapPanel },
  data() {
    return {
      simplePosts: Array<SimplePostDto>(),
      cursorId: '',
      isNoMorePage: false,
    };
  },
  methods: {
    async fetchPosts(cursorId: string | null = null) {
      await getAllPosts(20, cursorId)
      .then((posts) => {
        if(posts.first) {
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

.observer-trigger-enable {
  height: 900px;
  position: relative;
  margin-top: -600px;
}

.observer-trigger-enable {
  height: 0px;
}

</style>
