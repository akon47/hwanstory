<template>
  <div class="blog-simple-post-container">
    <h1>{{ this.blogId }}</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { SimplePostDto } from "@/api/models/blog.dtos";
import { getBlogPosts } from "@/api/blog";
import { HttpApiError } from "@/api/common/httpApiClient";
import { AccountDto } from "@/api/models/account.dtos";

export default defineComponent({
  name: 'BlogView',
  props: {
    blogId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      account: {} as AccountDto,
      simplePosts: Array<SimplePostDto>(),
      cursorId: '',
      isNoMorePage: false,
    };
  },
  watch: {
    blogId() {
      this.fetchBlogPosts();
    }
  },
  methods: {
    async fetchBlogPosts(cursorId: string | null = null) {
      if (!this.blogId)
        return;

      await getBlogPosts(this.blogId, 10, cursorId)
      .then((posts) => {
        if (posts.first) {
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
        await this.fetchBlogPosts(this.cursorId);
      }
    },
  },
  created() {
    this.fetchBlogPosts();
  }
});
</script>

<style scoped>

.blog-simple-post-container {
  display: grid;

  justify-content: center;

  padding: var(--base-gap);
}

</style>