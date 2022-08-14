<template>
  <div class="write-form-container">
    <div class="content">
      <textarea id="title" v-model="title" placeholder="제목을 입력하세요."/>
      <textarea id="postUrl" v-model="postUrl" placeholder="게시글 URL (입력하지 않으면 자동으로 생성됩니다.)" />
      <textarea id="content" v-model="content" placeholder="내용 입력하세요." />
    </div>
    <div class="footer">
      <div>

      </div>
      <div>

      </div>
      <button class="form-button" :disabled="!isTitleValid || !isContentValid || !isPostUrlValid" @click="writePost">
        글쓰기
      </button>
    </div>
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
    async writePost() {
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

.write-form-container {
  display: grid;

  grid-template-columns: 1fr;
  grid-template-rows: 1fr 50px;
}

.write-form-container .content {
  display: grid;

  grid-template-columns: 650px;
  grid-template-rows: auto auto 1fr;

  justify-content: center;
  row-gap: var(--base-gap);

  padding: var(--base-gap);
}

@media (max-width: 800px) {
  .write-form-container .content {
    grid-template-columns: auto;
    justify-content: stretch;
  }
}

.write-form-container textarea {
  background: transparent;

  width: auto;
  height: auto;
  border: none;
  resize: none;
  outline: none;
}

#title {
  font-size: 30px;
  font-weight: bold;
  line-height: 40px;
  height: 42px;
  overflow: hidden;

  padding-bottom: var(--base-gap);
  border-bottom: 2px solid var(--border-color);
}

#postUrl {
  font-size: 14px;
  line-height: 10px;
  padding-bottom: var(--half-base-gab);
  border-bottom: 1px solid var(--border-color);
  overflow: hidden;
}

.footer {
  display: grid;

  grid-template-columns: auto 1fr auto;
  grid-template-rows: 1fr;

  align-items: center;

  background: var(--footer-background-color);
  padding: 0 var(--base-gap)
}

.footer #form-button {
  min-width: 100px;
}

</style>
