<template>
  <ul>
    <li>
      {{ simplePost.title }} - ({{ simplePost.blogId }}/{{ simplePost.postUrl }}, 댓글:
      {{ simplePost.commentCount }}, 좋아요:
      {{ likeCount }})
      <button v-if="isMyPost" @click="deletePost(simplePost.postUrl)">삭제</button>
      <button @click="likePost(simplePost.blogId, simplePost.postUrl)">좋아요</button>
      <button @click="unlikePost(simplePost.blogId, simplePost.postUrl)">좋아요 취소</button>
      <ul>
        <li>
          - 내용: {{ simplePost.content }}
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts">
import { SimplePostDto } from "@/api/models/blog.dtos";
import { deletePost, likePost, unlikePost } from "@/api/blog";
import { HttpApiError } from "@/api/common/httpApiClient";
import { defineComponent, PropType } from "vue";
import store from "@/store";

export default defineComponent({
  name: "SimplePostItem",
  props: {
    simplePost: Object as PropType<SimplePostDto>,
  },
  data() {
    return {
      likeCount: 0,
    }
  },
  watch: {
    simplePost() {
      this.apply();
    }
  },
  computed: {
    isMyPost() {
      return this.simplePost?.blogId === store.state.accountStore.blogId;
    }
  },
  methods: {
    apply() {
      this.likeCount = this.simplePost?.likeCount ?? 0;
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
    }
  },
  created() {
    this.apply();
  },
});
</script>

<style scoped>

</style>