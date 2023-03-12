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
      <div v-if="nestedCommentsCount > 0" class="toggle-nested-replies" @click="toggleNestedReplies">
        <span v-if="isNestedCommentsOpened">숨기기</span>
        <span v-else>{{ nestedCommentsCount }} 개의 답글 보기</span>
      </div>
      <div v-else class="toggle-nested-replies" @click="toggleNestedReplies">
        <span v-if="isNestedCommentsOpened">숨기기</span>
        <span v-else>답글 달기</span>
      </div>
      <div v-if="isNestedCommentsOpened" class="nested-comments-container">
        <div class="line"/>
        <div class="nested-comments">
          <simple-comment-item
              v-for="comment in nestedComments" :key="comment.id"
              :simple-comment="comment"
              @deleted="commentDeleted"/>
          <div class="write-comment">
            <textarea v-model="newComment" placeholder="댓글 내용을 입력하세요."/>
            <div v-if="!isLoggedIn" class="guest-comment-info">
              <input v-model="guestCommentName" placeholder="이름" />
              <input v-model="guestCommentPassword" placeholder="비밀번호" type="password" autocomplete="off" />
              <div class="login-guide">
                <span>이름과 비밀번호 없이 댓글을 달기 위해서는 <router-link to="/signin">로그인</router-link>이 필요합니다.</span>
              </div>
            </div>
            <button :disabled="!isValidNewComment" @click="writeComment">답글 작성</button>
          </div>
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
import {
  createCommentToComment,
  createGuestCommentToComment,
  deleteComment,
  getComment,
  modifyComment
} from '@/api/blog';
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
      guestCommentName: '',
      guestCommentPassword: '',
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
    nestedCommentsCount(): number {
      return this.isNestedCommentsLoaded ? this.nestedComments.length ?? 0 : this.simpleComment?.childrenCount ?? 0;
    }
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
      const password = this.isGuestComment ? prompt("비밀번호를 입력하세요.") : null;
      if (!password) {
        return;
      }

      await modifyComment(id, {
        content: newContent,
      }, password)
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
      if (!password) {
        return;
      }

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

      if(this.isLoggedIn) {
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
      } else {
        await createGuestCommentToComment(this.simpleComment.id, {
          content: this.newComment,
          name: this.guestCommentName,
          password: this.guestCommentPassword
        })
        .then((comment) => {
          console.log(comment);
          this.newComment = '';
          this.guestCommentPassword = '';
          this.nestedComments.push(Object.assign(comment, {
            childrenCount: comment.children.length
          }));
          this.onCommentChanged();
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      }
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
  font-size: 0.8em;
  color: var(--link-accent-color);
}

@media(hover: hover) and (pointer: fine) {
  .footer .toggle-nested-replies:hover {
    text-decoration: underline;
    cursor: pointer;
  }
}

.footer .nested-comments-container {
  display: grid;

  grid-template-columns: auto 1fr;
  grid-auto-rows: auto;
}

.nested-comments-container .line {
  width: 5px;
  background-color: var(--border-color);
  margin: 0.5em var(--half-base-gab) 0 1em;
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

.guest-comment-info {
  justify-self: start;

  display: grid;

  grid-auto-flow: column;

  grid-auto-columns: auto;
  grid-column-gap: 0.5em;
}

.guest-comment-info input {
  width: 100px;
  padding: 4px 8px;
  box-sizing: border-box;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--border-color);
  outline: none;

  align-self: start;
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
  font-size: 0.9em;
  align-self: center;
}

</style>