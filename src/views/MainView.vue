<template>
  <div>
    <ol>
      <li v-for="post in posts" :key="post.blogId + post.postUrl">
        <ul>
          <li>
            {{ post.title }} - ({{ post.blogId }}/{{ post.postUrl }}, 댓글: {{ post.commentCount }}, 좋아요: {{ post.likeCount }})
            <button @click="deletePost(post.postUrl)">delete</button>
            <ul>
              <li>
                - 내용: {{ post.content }}
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { SimplePostDto } from '@/api/models/blog.dtos';
import { deletePost, getAllPosts } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'MainView',
  data() {
    return {
      posts: Array<SimplePostDto>(),
    };
  },
  methods: {
    async fetchPosts() {
      await getAllPosts(20)
      .then((posts) => {
        this.posts = posts.data;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async deletePost(postUrl: string) {
      await deletePost(postUrl)
      .then(async () => {
        alert("게시글을 삭제했습니다.");
        await this.fetchPosts();
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    }
  },
  mounted() {
    this.fetchPosts();
  },
});
</script>

<style scoped>

</style>
