<template>
  <div>
    <ol>
      <li v-for="post in posts" :key="post.blogId + post.postUrl">
        <ul>
          <li>
            {{ post.title }} - ({{ post.blogId }}/{{ post.postUrl }})
            <ul>
              <li>
                {{ post.content }}
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
import { getAllPosts } from '@/api/blog';
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
  },
  mounted() {
    this.fetchPosts();
  },
});
</script>

<style scoped>

</style>
