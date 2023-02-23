<template>
  <post-viewer :content="content" />
  <div class="empty-message" v-if="isEmpty && emptyMessage">
    {{ emptyMessage }}
  </div>
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
    emptyMessage: {
      type: String,
    },
  },
  data() {
    return {
      content: '',
      isEmpty: false,
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
        this.isEmpty = !this.content || this.content.length === 0;
      } else {
        alert(error.getErrorMessage());
      }
    });
  },
});
</script>

<style scoped>

.empty-message {
  text-align: center;
  font-size: 1.25em;
  font-weight: bold;
  padding-top: 2em;
}

</style>