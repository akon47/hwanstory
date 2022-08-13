<template>
  <div class="main-container">
    <simple-post-wrap-panel :simple-posts="simplePosts"></simple-post-wrap-panel>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import { getAllPosts } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import SimplePostWrapPanel from "@/components/posts/SimplePostWrapPanel.vue";

export default defineComponent({
  name: 'MainView',
  components: { SimplePostWrapPanel },
  data() {
    return {
      simplePosts: Array<SimplePostDto>(),
    };
  },
  methods: {
    async fetchPosts() {
      await getAllPosts(20)
      .then((posts) => {
        this.simplePosts = posts.data;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
  },
  mounted() {
    this.fetchPosts();
  },
});
</script>

<style scoped>

</style>
