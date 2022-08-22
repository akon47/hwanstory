<template>
  <post-viewer :content="content"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PostViewer from '@/components/posts/PostViewer.vue';
import { getPost } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'PostLoader',
  components: { PostViewer },
  props: {
    blogId: {
      type: String,
      required: true,
    },
    postUrl: {
      type: String,
      required: true,
    },
    defaultContent: {
      type: String,
    },
  },
  data() {
    return {
      content: '',
    };
  },
  async mounted() {
    await getPost(this.blogId, this.postUrl)
    .then((post) => {
      this.content = post.content;
    })
    .catch((error: HttpApiError) => {
      if (error.isNotFound()) {
        this.content = this.defaultContent ?? '';
      } else {
        alert(error.getErrorMessage());
      }
    });
  },
});
</script>

<style scoped>

</style>