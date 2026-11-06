<template>
  <div class="post-loader">
    <post-viewer v-if="content" :content="content"/>
    <div v-else-if="isEmpty" class="empty-state">
      <div class="empty-icon"><app-icon name="user" :size="26"/></div>
      <div class="empty-title">{{ emptyMessage }}</div>
      <template v-if="isMyBlog">
        <div>글 주소를 <b>about-me</b> 로 지어 글을 쓰면 이 자리에 소개가 보입니다.</div>
        <router-link class="btn btn-secondary" to="/write">소개 글 쓰기</router-link>
      </template>
    </div>
    <div v-else class="loading">
      <loading-spinner/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PostViewer from '@/components/posts/PostViewer.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { getPost } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import store from '@/store';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'PostLoader',
  components: { AppIcon, LoadingSpinner, PostViewer },
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
  computed: {
    isMyBlog(): boolean {
      return this.blogId === store.state.accountStore.blogId;
    },
  },
  watch: {
    blogId() {
      this.load();
    },
  },
  methods: {
    async load() {
      this.content = '';
      this.isEmpty = false;
      await getPost(this.blogId, this.postUrl)
      .then((post) => {
        this.content = post.content;
        this.isEmpty = !this.content;
      })
      .catch((error: HttpApiError) => {
        if (error.isNotFound()) {
          this.content = this.defaultContent ?? '';
          this.isEmpty = !this.content || this.content.length === 0;
        } else {
          toast.error(error.getErrorMessage());
          this.isEmpty = true;
        }
      });
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  padding: var(--s-10) 0;
}
</style>
