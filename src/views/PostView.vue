<template>
  <div class="post-container">
    <div class="title">
      <h1>
        {{ post.title }}
      </h1>
      <div class="author">
        <account-profile-image-button class="author-profile-image" :simple-account="post.author" />
        <div class="author-name">
          {{ post.author?.name }}
        </div>
        <div class="created-at">
          {{ longCreateAt }}
        </div>
      </div>
    </div>
    <div class="content">
      {{ post.content }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { PostDto } from "@/api/models/blog.dtos";
import { deletePost, getPost, likePost, unlikePost } from '@/api/blog';
import { HttpApiError } from "@/api/common/httpApiClient";
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';

export default defineComponent({
  name: 'PostView',
  components: { AccountProfileImageButton },
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
      post: {} as PostDto,
      likeCount: 0,
    };
  },
  computed: {
    longCreateAt() {
      if(!this.post?.createdAt) {
        return null;
      }
      const date = new Date(this.post.createdAt);
      const hours = `${date.getHours()}`.padStart(2, '0');
      const minutes = `${date.getMinutes()}`.padStart(2, '0');
      return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${hours}:${minutes}`;
    },
  },
  watch: {
    postUrl() {
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
        this.likeCount = post.likeCount;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async likePost(blogId: string, postUrl: string) {
      await likePost(blogId, postUrl)
      .then(async () => {
        this.likeCount++;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async unlikePost(blogId: string, postUrl: string) {
      await unlikePost(blogId, postUrl)
      .then(async () => {
        this.likeCount--;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async deletePost(postUrl: string) {
      await deletePost(postUrl)
      .then(async () => {
        alert("게시글을 삭제했습니다.");
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
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
  grid-auto-rows: auto;

  justify-content: center;

  padding: var(--base-gap);
  box-sizing: border-box;
}

@media (max-width: 800px) {
  .post-container {
    grid-template-columns: auto;
    justify-content: stretch;
  }
}

.title {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1em;
  margin-bottom: 2em;
}

.author {
  display: grid;

  grid-template-columns: auto auto 1fr;
  grid-template-rows: auto auto;

  margin-top: 2em;
}

.author-profile-image {
  width: 3em;
  height: 3em;

  justify-self: center;

  grid-column: 1 / span 1;
  grid-row: 1 / span 2;

  margin-right: 0.5em;
}

.author-name {
  align-self: end;

  grid-column: 2 / span 1;
  grid-row: 1 / span 1;

  font-size: 0.75em;
  font-weight: 300;
}

.created-at {
  align-self: start;

  grid-column: 2 / span 1;
  grid-row: 2 / span 1;

  font-size: 0.75em;
  font-weight: 300;
}

</style>