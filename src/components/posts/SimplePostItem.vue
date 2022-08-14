<template>
  <div class="simple-post-item-container">
    <div class="title-image" @click="moveToPost">

    </div>
    <div class="title" @click="moveToPost">
      {{ simplePost.title }}
    </div>
    <div class="content" @click="moveToPost">
      {{ simplePost.content }}
    </div>
    <div class="footer">
      <div class="footer-content">
        <div>
          by&nbsp;<a @click="moveToBlog"><b>{{ simplePost.blogId }}</b></a>
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
    moveToPost() {
      this.$router.push(`/${this.simplePost?.blogId}/${this.simplePost?.postUrl}`);
    },
    moveToBlog() {
      this.$router.push(`/${this.simplePost?.blogId}`);
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
  grid-template-rows: auto auto 1fr 40px;

  width: 100%;
  aspect-ratio: 10 / 12;

  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);

  background: var(--content-item-background-color);
  transition: box-shadow .2s;
}

.simple-post-item-container:hover {
  box-shadow: 0 0 11px var(--base-shadow-color);
  cursor: pointer;
}

.simple-post-item-container .title {
  font-size: 16px;
  font-weight: 500;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  margin: var(--half-base-gab);
}

.simple-post-item-container .content {
  font-size: 14px;
  font-weight: normal;

  overflow: hidden;
  text-overflow: ellipsis;

  margin: 0 var(--half-base-gab) var(--half-base-gab) var(--half-base-gab)
}

.simple-post-item-container .footer {
  display: grid;
  border-top: 1px solid var(--border-color);

  align-items: center;
}

.footer {
  cursor: auto;
}

.footer .footer-content {
  display: grid;

  grid-template-columns: auto 1fr auto auto;
  grid-template-rows: 1fr;

  column-gap: 5px;

  font-size: 12px;
  font-weight: normal;
  margin: 0 var(--half-base-gab);
}

</style>