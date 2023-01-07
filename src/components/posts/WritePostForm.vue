<template>
  <div class="write-form-container">
    <div class="content">
      <textarea id="title" v-model="title" placeholder="제목을 입력하세요."/>
      <textarea id="postUrl" v-model="newPostUrl" placeholder="게시글 URL (입력하지 않으면 자동으로 생성됩니다.)" />
      <tag-input-box id="tags" v-model="tags"/>
      <post-editor id="editor" v-model="content"/>
    </div>
    <div class="footer">
      <span><input id="private-post" type="checkbox" v-model="isPrivatePost" /><label for="private-post">비공개 게시글</label></span>
      <button v-if="isNewPost" class="form-button"
              :disabled="!isTitleValid || !isContentValid || !isPostUrlValid || isLoading"
              @click="writePost">
        글쓰기
      </button>
      <button v-else class="form-button"
              :disabled="!isTitleValid || !isContentValid || !isPostUrlValid || isLoading"
              @click="modifyPost">
        수정하기
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { HttpApiError } from '@/api/common/httpApiClient';
import { createPost, getPost, modifyPost } from '@/api/blog';
import store from '@/store';
import { TagDto } from '@/api/models/blog.dtos';
import PostEditor from '@/components/posts/PostEditor.vue';
import { uploadFileFromUrl } from '@/api/attachments';
import TagInputBox from '@/components/posts/TagInputBox.vue';
import { marked } from 'marked';

export default defineComponent({
  name: 'WritePostForm',
  components: { TagInputBox, PostEditor },
  props: {
    postUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      title: '',
      content: '',
      newPostUrl: '',
      isLoading: false,
      tags: Array<string>(),
      isPrivatePost: false,
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
      if (this.newPostUrl.length == 0)
        return true;

      const regex = /^[-a-zA-Z\d_]+$/;
      return regex.test(this.newPostUrl);
    },
    isNewPost(): boolean {
      return !this.postUrl;
    },
  },
  watch: {
    newPostUrl() {
      this.newPostUrl = this.newPostUrl.replace(/(\r\n|\n|\r)/gm, '');
    },
  },
  methods: {
    async writePost() {
      this.isLoading = true;
      await createPost({
        title: this.title,
        content: this.content,
        summary: this.createSummaryFromContent(this.content),
        openType: this.isPrivatePost ? 'PRIVATE' : 'PUBLIC',
        postUrl: this.newPostUrl ? this.newPostUrl : null,
        thumbnailFileId: await this.getThumbnailFileId(),
        tags: this.tags?.map(name => ({ name } as TagDto)),
      })
      .then((post) => {
        this.$router.push(`/${post.blogId}/posts/${post.postUrl}`);
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async modifyPost() {
      this.isLoading = true;
      await modifyPost(this.postUrl, {
        title: this.title,
        content: this.content,
        summary: this.createSummaryFromContent(this.content),
        openType: this.isPrivatePost ? 'PRIVATE' : 'PUBLIC',
        postUrl: this.newPostUrl ? this.newPostUrl : null,
        thumbnailFileId: await this.getThumbnailFileId(),
        tags: this.tags?.map(name => ({ name } as TagDto)),
      })
      .then((post) => {
        this.$router.push(`/${post.blogId}/posts/${post.postUrl}`);
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async loadPost() {
      if (this.postUrl) {
        await getPost(store.state.accountStore.blogId, this.postUrl)
        .then((post) => {
          this.title = post.title;
          this.newPostUrl = post.postUrl;
          this.content = post.content;
          this.tags = post.tags?.map(x => x.name);
          this.isPrivatePost = post.openType == 'PRIVATE';
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
          this.$router.push(`/`);
        });
      }
    },
    async getThumbnailFileId() {
      const urls = /!\[.*?\]\((.*?)\)/.exec(this.content);
      if (urls) {
        const imageUrl = new URL(urls[1]);
        return await uploadFileFromUrl(imageUrl)
        .then((file) => {
          return file.id;
        })
        .catch(() => {
          return undefined;
        });
      }
    },
    createSummaryFromContent(content: string) {
      const renderer = new marked.Renderer();
      renderer.code = () => '\n';
      renderer.blockquote = () => '\n';
      renderer.html = () => '\n';
      renderer.heading = () => '\n';
      renderer.hr = () => '\n';
      renderer.list = () => '\n';
      renderer.listitem = () => '\n';
      renderer.checkbox = () => '\n';
      renderer.table = () => '\n';
      renderer.tablerow = () => '\n';
      renderer.tablecell = () => '\n';
      renderer.strong = (text) => text.trim();
      renderer.em = (text) => text.trim();
      renderer.codespan = (code) => code.trim();
      renderer.br = () => '\n';
      renderer.del = () => '\n';
      renderer.link = (href, title, text) => text.trim();
      renderer.image = () => '\n';
      renderer.paragraph = (text) => text.trim();

      let summary = marked(content, {
        renderer: renderer,
      }).split('\n').filter(Boolean)[0];
      if (!summary) {
        return '내용없음';
      }

      const doc = new DOMParser().parseFromString(summary, "text/html");
      summary = doc.documentElement.textContent ?? '';

      return summary.length > 255 ? summary.substring(0, 255) : summary;
    },
  },
  created() {
    this.loadPost();
  },
});
</script>

<style scoped>

.write-form-container {
  display: grid;

  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: 1fr 50px;
}

.write-form-container .content {
  display: grid;

  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto auto 1fr;

  justify-content: stretch;
  padding: var(--base-gap);
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
  height: 45px;
  overflow: hidden;

  border-bottom: 2px solid var(--border-color);
}

#postUrl {
  line-height: 28px;

  border-bottom: 1px solid var(--border-color);
  overflow: hidden;
  font-size: 16px;
  white-space: nowrap;
  height: 28px;
}

#tags {
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--base-gap);
  padding: 2px 0;
  min-height: 30px;
}

#editor {

}

.footer {
  display: grid;

  grid-auto-columns: auto;
  grid-template-rows: 1fr;

  align-items: center;
  align-content: center;
  justify-content: end;

  background: var(--footer-background-color);
  padding: 0 var(--base-gap);

  grid-auto-flow: column;

  grid-column-gap: 10px;

  font-size: 0.8em;
}

.footer span {
  display: flex;
  align-items: center;
}

.footer .form-button {
  min-width: 100px;
}

</style>
