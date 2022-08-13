<template>
  <div class="simple-post-item-container" @click="click">
    <div class="title-image">

    </div>
    <div class="title">
      {{ simplePost.title }}
    </div>
    <div class="content">
      {{ simplePost.content }}
    </div>
    <div class="footer">
      <div class="footer-content">
        <div>
          by {{ simplePost.blogId }}
        </div>
        <div>

        </div>
        <div>
          💬{{ simplePost.commentCount }}
        </div>
        <div>
          ❤️{{ likeCount }}
        </div>
      </div>
    </div>
  </div>
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
    click() {
      this.$router.push(`/${this.simplePost?.blogId}/${this.simplePost?.postUrl}`);
    },
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

.simple-post-item-container {
  display: grid;

  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr 35px;

  width: 100%;
  height: 250px;

  border: 1px solid #e0e0e0;
  border-radius: 5px;

  background: white;

  transition: box-shadow .2s;
}

.simple-post-item-container:hover {
  box-shadow: 0 0 11px rgba(33,33,33,.2);
  cursor: pointer;
}

.simple-post-item-container .title-image {

}

.simple-post-item-container .title {
  font-size: 16px;
  font-weight: bold;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  margin: 10px;
}

.simple-post-item-container .content {
  font-size: 14px;
  font-weight: normal;

  overflow: hidden;
  text-overflow: ellipsis;

  margin: 0 10px 10px 10px
}

.simple-post-item-container .footer {
  display: grid;
  border-top: 1px solid #e0e0e0;

  align-items: center;
}

.footer .footer-content {
  display: grid;

  grid-template-columns: auto 1fr auto auto;
  grid-template-rows: 1fr;

  column-gap: 5px;

  font-size: 12px;
  font-weight: normal;
  margin: 0 10px;
}

</style>