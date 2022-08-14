<template>
  <div class="post-container">
    <h1 class="title">
      {{ post.title }}
    </h1>
    <div class="content">
      {{ post.content }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { PostDto } from "@/api/models/blog.dtos";
import { getPost } from "@/api/blog";
import { HttpApiError } from "@/api/common/httpApiClient";

export default defineComponent({
  name: 'PostView',
  props: {
    blogId: {
      type: String,
      required: true,
    },
    postUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      post: {} as PostDto
    };
  },
  watch: {
    post() {
      this.loadPost();
    }
  },
  methods: {
    async loadPost() {
      if (!this.blogId || !this.postUrl)
        return;

      await getPost(this.blogId, this.postUrl)
      .then((post) => {
        this.post = post;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    }
  },
  created() {
    this.loadPost();
  }
});
</script>

<style scoped>

.post-container {
  display: grid;

  grid-template-columns: 650px;
  justify-content: center;

  padding: var(--base-gap);
}

@media (max-width: 800px) {
  .post-container {
    grid-template-columns: auto;
    justify-content: stretch;
  }
}

</style>