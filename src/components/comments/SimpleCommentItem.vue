<template>
  <div class="comment-item-container">
    <div class="author">
      <account-profile-image-button class="profile-image" :simple-account="simpleComment.author"/>
      <div class="name">
        {{ simpleComment.author?.name }}
      </div>
      <div class="created-at">
        {{ longCreatedAt }}
        <span class="modify-actions" v-if="isMyComment">
            <a @click="modifyComment">수정</a>
            <span>&#183;</span>
            <a @click="deleteComment">삭제</a>
          </span>
      </div>
    </div>
    <div class="content">
      {{ content }}
    </div>
    <div class="reply">
      <button @click="writeComment">댓글 작성</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { SimpleCommentDto } from "@/api/models/blog.dtos";
import AccountProfileImageButton from "@/components/accounts/AccountProfileImageButton.vue";
import dayjs from "dayjs";
import store from "@/store";
import { deleteComment, modifyComment } from "@/api/blog";
import { HttpApiError } from "@/api/common/httpApiClient";

export default defineComponent({
  name: "SimpleCommentItem",
  components: { AccountProfileImageButton },
  props: {
    simpleComment: Object as PropType<SimpleCommentDto>,
  },
  data() {
    return {
      content: '',
    }
  },
  watch: {
    simpleComment() {
      this.content = this.simpleComment?.content ?? '';
    },
  },
  computed: {
    longCreatedAt() {
      return dayjs(this.simpleComment?.createdAt).format('YYYY.MM.DD H:mm');
    },
    isMyComment() {
      return this.simpleComment?.author.blogId === store.state.accountStore.blogId;
    }
  },
  methods: {
    async modifyComment() {
      if (!this.simpleComment?.id) {
        return;
      }
      const id = this.simpleComment.id;
      const newContent = prompt("수정할 내용", this.simpleComment.content);
      if (!newContent) {
        return;
      }

      await modifyComment(id, {
        content: newContent
      })
      .then((comment) => {
        alert("댓글을 수정했습니다.");
        this.content = comment.content;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async deleteComment() {
      if (!this.simpleComment?.id || !confirm('댓글을 삭제하시겠습니까?')) {
        return;
      }
      const id = this.simpleComment.id;
      await deleteComment(id)
      .then(() => {
        alert("댓글을 삭제했습니다.");
        this.$emit('deleted', id);
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async writeComment() {
      alert('not implemented yet!');
    },
  },
  created() {
    this.content = this.simpleComment?.content ?? '';
  },
});
</script>

<style scoped>

.comment-item-container {
  display: grid;
  grid-auto-rows: auto;
  grid-column-gap: 20px;

  padding-bottom: 1em;
  margin: 1em 0;
  border-bottom: 1px solid var(--border-color);
}

.comment-item-container .author {
  display: grid;
  grid-template-columns: auto auto 1fr;
  grid-template-rows: auto auto;
}

.comment-item-container .content {
  padding: 1em 0;
}

.comment-item-container .reply {
  justify-self: end;
}

.author .profile-image {
  width: 3em;
  height: 3em;

  justify-self: center;

  grid-column: 1 / span 1;
  grid-row: 1 / span 2;

  margin-right: 0.5em;
}

.author .name {
  align-self: end;

  grid-column: 2 / span 1;
  grid-row: 1 / span 1;

  font-size: 0.75em;
  font-weight: 300;
}

.author .created-at {
  align-self: start;

  grid-column: 2 / span 1;
  grid-row: 2 / span 1;

  font-size: 0.75em;
  font-weight: 300;
}

.modify-actions {
  padding-left: 5px;
}

.modify-actions a {
  color: var(--base-color);
  margin: 0 3px;
}

</style>