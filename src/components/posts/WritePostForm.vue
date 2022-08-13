<template>
  <div>
    <form @submit.prevent="submitForm">
      <div>
        <label for="title">제목</label>
        <input type="text" id="title" v-model="title"/>
      </div>
      <div>
        <label for="content">내용</label>
        <input type="text" id="content" v-model="content"/>
      </div>
      <div>
        <label for="postUrl">게시글 URL</label>
        <input type="text" id="postUrl" v-model="postUrl"/>
      </div>
      <button :disabled="!isTitleValid || !isContentValid || !isPostUrlValid" type="submit">
        글쓰기
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { HttpApiError } from '@/api/common/httpApiClient';
import { createPost } from '@/api/blog';

export default defineComponent({
  name: 'WritePostForm',
  data() {
    return {
      title: '',
      content: '',
      postUrl: '',
    };
  },
  computed: {
    isTitleValid(): boolean {
      return this.title.length > 0;
    },
    isContentValid(): boolean {
      return this.content.length > 0;
    },
    isPostUrlValid(): boolean {
      const regex = /^[-a-zA-Z\d_]*$/;
      return regex.test(this.postUrl);
    },
  },
  methods: {
    async submitForm() {
      await createPost({
        title: this.title,
        content: this.content,
        postUrl: this.postUrl,
        tags: []
      })
      .then(() => {
        this.$router.push('/main');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
  },
});
</script>

<style scoped>

</style>
