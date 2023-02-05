<template>
  <div class="comment-item-container">
    <div class="author">
      <account-profile-image-button class="profile-image" :simple-account="simpleComment.author"/>
      <div class="name">
        {{ simpleComment.author?.name }}
      </div>
      <div class="created-at">
        {{ longCreatedAt }}
        <span class="modify-actions" v-if="isMyComment || isGuestComment">
            <a @click="modifyComment">수정</a>
            <span>&#183;</span>
            <a @click="deleteComment">삭제</a>
          </span>
      </div>
    </div>
    <div class="content">
      {{ content }}
    </div>
    <div v-if="!simpleComment.parentId" class="footer">
      <button class="toggle-nested-replies" @click="toggleNestedReplies">
        {{ isNestedCommentsLoaded ? nestedComments.length ?? 0 : simpleComment.childrenCount }}
        개의 대댓글
        <span v-if="isNestedCommentsOpened">숨기기</span>
        <span v-else>보기</span>
      </button>
      <div v-if="isNestedCommentsOpened" class="nested-comments-container">
        <div class="line"/>
        <div class="nested-comments">
          <div v-if="isLoggedIn" class="write-comment">
            댓글 남기기
            <textarea v-model="newComment" placeholder="대댓글 내용을 입력하세요."/>
            <button :disabled="!isValidNewComment" @click="writeComment">대댓글 작성</button>
          </div>
          <div v-else class="login-guide">
            <span>대댓글을 달기 위해서는 <router-link to="/signin">로그인</router-link>이 필요합니다.</span>
          </div>
          <simple-comment-item
              v-for="comment in nestedComments" :key="comment.id"
              :simple-comment="comment"
              @deleted="commentDeleted"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimpleCommentDto } from '@/api/models/blog.dtos';
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';
import dayjs from 'dayjs';
import store from '@/store';
import { createCommentToComment, deleteComment, getComment, modifyComment } from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'SimpleCommentItem',
  components: { AccountProfileImageButton },
  props: {
    simpleComment: Object as PropType<SimpleCommentDto>,
  },
  data() {
    return {
      content: '',
      newComment: '',
      isNestedCommentsOpened: false,
      nestedComments: {} as Array<SimpleCommentDto>,
      isNestedCommentsLoaded: false,
    };
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
    isValidNewComment() {
      return this.newComment.length > 0;
    },
    isMyComment() {
      return this.simpleComment?.author.blogId === store.state.accountStore.blogId;
    },
    isGuestComment() {
      return this.simpleComment?.author?.guest;
    },
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
  },
  methods: {
    async modifyComment() {
      if (!this.simpleComment?.id) {
        return;
      }
      const id = this.simpleComment.id;
      const newContent = prompt('수정할 내용을 입력하세요.', this.simpleComment.content);
      if (!newContent) {
        return;
      }

      await modifyComment(id, {
        content: newContent,
      })
      .then((comment) => {
        alert('댓글을 수정했습니다.');
        this.content = comment.content;
        this.onCommentChanged();
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
      const password = this.isGuestComment ? prompt("비밀번호를 입력하세요.") : null;
      await deleteComment(id, password)
      .then(() => {
        this.$emit('deleted', id);
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async writeComment() {
      if (!this.simpleComment?.id) {
        return;
      }

      await createCommentToComment(this.simpleComment.id, {
        content: this.newComment,
      })
      .then((comment) => {
        this.newComment = '';
        this.nestedComments.push(Object.assign(comment, {
          childrenCount: comment.children.length
        }));
        this.onCommentChanged();
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async toggleNestedReplies() {
      if (!this.simpleComment?.id) {
        return;
      }

      this.isNestedCommentsOpened = !this.isNestedCommentsOpened;
      if (this.isNestedCommentsOpened && !this.isNestedCommentsLoaded) {
        await getComment(this.simpleComment.id)
        .then((comment) => {
          this.nestedComments = comment.children;
          this.isNestedCommentsLoaded = true;
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
          this.isNestedCommentsOpened = !this.isNestedCommentsOpened;
        });
      }
    },
    commentDeleted(commentId: string) {
      this.nestedComments = this.nestedComments.filter((x) => x.id !== commentId);
      this.onCommentChanged();
    },
    onCommentChanged() {
      if (!this.simpleComment) {
        return;
      }

      this.$emit('changed', {
        id: this.simpleComment.id,
        content: this.content,
        parentId: this.simpleComment.parentId,
        childrenCount: this.nestedComments.length,
        author: this.simpleComment.author,
        createdAt: this.simpleComment.createdAt
      } as SimpleCommentDto);
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
  margin-top: 1em;
  border-bottom: 1px solid var(--border-color);
}

.comment-item-container .author {
  display: grid;
  grid-template-columns: auto auto 1fr;
  grid-template-rows: auto auto;
}

.comment-item-container .content {
  padding-top: 1em;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.comment-item-container .footer {
  display: grid;

  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
}

.footer .toggle-nested-replies {
  justify-self: start;
  margin-top: 1em;
}

.footer .nested-comments-container {
  display: grid;

  grid-template-columns: auto 1fr;
  grid-auto-rows: auto;
}

.nested-comments-container .line {
  width: 5px;
  background-color: var(--border-color);
  margin: 20px 10px 0 10px;
}

.write-comment {
  padding: 1em 0;
  display: grid;

  grid-auto-rows: auto;
  grid-row-gap: 0.5em;
}

.write-comment textarea {
  font-size: 14px;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--border-color);
  resize: none;
  outline: none;
}

.write-comment button {
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

.login-guide {
  display: flex;
  justify-content: center;
  padding: 2em 0 1em 0;
}

</style>