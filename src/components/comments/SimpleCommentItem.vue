<template>
  <div class="comment" :class="{ reply: isReply }" :id="`comment-${simpleComment?.id}`">
    <account-profile-image-button class="comment-avatar" :simple-account="simpleComment?.author"/>
    <div class="comment-body">
      <div class="comment-head">
        <router-link v-if="!isGuestComment" class="name" :to="`/${simpleComment?.author?.blogId}`">
          {{ simpleComment?.author?.name }}
        </router-link>
        <span v-else class="name">{{ simpleComment?.author?.name }}</span>
        <span v-if="isGuestComment" class="badge">손님</span>
        <span v-if="isPostAuthor" class="badge badge-accent">글쓴이</span>
        <time class="time" :title="fullCreatedAt">{{ relativeCreatedAt }}</time>
      </div>

      <div v-if="isEditing" class="edit-box">
        <textarea ref="edit-textarea" class="textarea" v-model="editContent" rows="3"/>
        <div class="edit-actions">
          <button class="btn btn-ghost btn-sm" type="button" @click="isEditing = false">취소</button>
          <button class="btn btn-sm" type="button" :disabled="editContent.trim().length === 0 || isBusy" @click="saveEdit">저장</button>
        </div>
      </div>
      <!-- 댓글 내용을 마크다운으로 렌더링한다. (원시 HTML 은 이스케이프되어 XSS 를 방지한다) -->
      <div v-else class="content markdown-content" v-html="renderedContent"/>

      <div class="comment-actions">
        <button class="action" :class="{ liked: isLiked }" type="button" :aria-pressed="isLiked" @click="toggleCommentLike">
          <app-icon name="heart" :size="15"/>
          <span>{{ likeCount > 0 ? likeCount : '좋아요' }}</span>
        </button>
        <button v-if="!isReply" class="action" type="button" @click="toggleNestedReplies">
          <app-icon name="reply" :size="15"/>
          <span v-if="isNestedCommentsOpened">답글 닫기</span>
          <span v-else>답글<template v-if="nestedCommentsCount > 0"> {{ nestedCommentsCount }}</template></span>
        </button>
        <template v-if="(isMyComment || isGuestComment) && !isEditing">
          <button class="action" type="button" @click="startEdit">수정</button>
          <button class="action danger" type="button" @click="deleteComment">삭제</button>
        </template>
        <button v-else-if="isMyPost && !isMyComment" class="action danger" type="button" @click="deleteComment">삭제</button>
      </div>

      <div v-if="isNestedCommentsOpened" class="replies">
        <div v-if="isLoadingReplies" class="replies-loading"><loading-spinner :size="20"/></div>
        <simple-comment-item v-for="comment in nestedComments" :key="comment.id" :simple-comment="comment" :post="post"
                             @deleted="commentDeleted"/>
        <comment-composer compact submit-label="답글 남기기" placeholder="답글을 남겨보세요" cancelable autofocus
                          @submit="writeReply" @cancel="isNestedCommentsOpened = false"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, PropType } from 'vue';
import { PostDto, SimpleCommentDto } from '@/api/models/blog.dtos';
import AccountProfileImageButton from '@/components/accounts/AccountProfileImageButton.vue';
import CommentComposer, { CommentDoneCallback, CommentSubmission } from '@/components/comments/CommentComposer.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import store from '@/store';
import {
  createCommentToComment,
  createGuestCommentToComment,
  deleteComment,
  getComment,
  isCommentLiked,
  likeComment,
  modifyComment,
  unlikeComment,
} from '@/api/blog';
import { HttpApiError } from '@/api/common/httpApiClient';
import { marked } from 'marked';
import { confirmDialog, promptDialog, toast } from '@/utils/dialog';
import { formatDateTime, formatRelativeDate } from '@/utils/format';

export default defineComponent({
  name: 'SimpleCommentItem',
  components: { AppIcon, LoadingSpinner, CommentComposer, AccountProfileImageButton },
  props: {
    simpleComment: Object as PropType<SimpleCommentDto>,
    post: Object as PropType<PostDto>,
  },
  emits: ['deleted', 'changed'],
  data() {
    return {
      content: '',
      editContent: '',
      isEditing: false,
      isBusy: false,
      isNestedCommentsOpened: false,
      isLoadingReplies: false,
      nestedComments: [] as Array<SimpleCommentDto>,
      isNestedCommentsLoaded: false,
      likeCount: 0,
      isLiked: false,
    };
  },
  watch: {
    simpleComment() {
      this.content = this.simpleComment?.content ?? '';
      this.likeCount = this.simpleComment?.likeCount ?? 0;
    },
  },
  computed: {
    isReply(): boolean {
      return !!this.simpleComment?.parentId;
    },
    relativeCreatedAt(): string {
      return formatRelativeDate(this.simpleComment?.createdAt);
    },
    fullCreatedAt(): string {
      return formatDateTime(this.simpleComment?.createdAt);
    },
    // 댓글 내용을 마크다운으로 렌더링한다.
    // 1) 원시 HTML 특수문자를 먼저 이스케이프하고, 2) 링크/이미지의 위험한 프로토콜(javascript: 등)을 제거하여 XSS 를 방지한다.
    renderedContent(): string {
      const escaped = (this.content ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const sanitizeUrl = (href: string | null): string => {
        if (!href) {
          return '';
        }
        const lowered = href.trim().toLowerCase();
        if (lowered.startsWith('javascript:') || lowered.startsWith('data:') || lowered.startsWith('vbscript:')) {
          return '';
        }
        return href.replace(/"/g, '&quot;');
      };

      const renderer = new marked.Renderer();
      renderer.link = (href, title, text) => {
        const safe = sanitizeUrl(href);
        if (!safe) {
          return text;
        }
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer nofollow">${text}</a>`;
      };
      renderer.image = (href, title, text) => {
        const safe = sanitizeUrl(href);
        if (!safe) {
          return text ?? '';
        }
        return `<img src="${safe}" alt="${(text ?? '').replace(/"/g, '&quot;')}">`;
      };

      return marked(escaped, { breaks: true, renderer });
    },
    isMyComment(): boolean {
      return !this.isGuestComment && this.simpleComment?.author?.blogId === store.state.accountStore.blogId;
    },
    isGuestComment(): boolean {
      return !!this.simpleComment?.author?.guest;
    },
    isPostAuthor(): boolean {
      return !this.isGuestComment && !!this.post?.author?.blogId && this.simpleComment?.author?.blogId === this.post.author.blogId;
    },
    isMyPost(): boolean {
      return !!this.post?.author?.blogId && this.post.author.blogId === store.state.accountStore.blogId;
    },
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    nestedCommentsCount(): number {
      return this.isNestedCommentsLoaded ? this.nestedComments.length : this.simpleComment?.childrenCount ?? 0;
    },
  },
  methods: {
    startEdit() {
      this.editContent = this.content;
      this.isEditing = true;
      nextTick(() => (this.$refs['edit-textarea'] as HTMLTextAreaElement | undefined)?.focus());
    },
    async saveEdit() {
      if (!this.simpleComment?.id) {
        return;
      }
      const id = this.simpleComment.id;
      let password: string | null = null;
      if (this.isGuestComment) {
        password = await promptDialog({
          title: '비밀번호 확인',
          message: '댓글을 쓸 때 입력한 비밀번호를 입력하세요.',
          type: 'password',
          placeholder: '비밀번호',
          confirmLabel: '저장',
        });
        if (!password) {
          return;
        }
      }
      this.isBusy = true;
      await modifyComment(id, { content: this.editContent.trim() }, password)
      .then((comment) => {
        this.content = comment.content;
        this.isEditing = false;
        toast.success('댓글을 수정했습니다.');
        this.onCommentChanged();
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isBusy = false;
      });
    },
    async deleteComment() {
      if (!this.simpleComment?.id) {
        return;
      }
      const ok = await confirmDialog({
        title: '댓글을 삭제할까요?',
        message: '삭제한 댓글은 되돌릴 수 없습니다.',
        confirmLabel: '삭제',
        danger: true,
      });
      if (!ok) {
        return;
      }
      const id = this.simpleComment.id;
      const passwordRequired = this.isGuestComment && !this.isMyPost;
      let password: string | null = null;
      if (passwordRequired) {
        password = await promptDialog({
          title: '비밀번호 확인',
          message: '댓글을 쓸 때 입력한 비밀번호를 입력하세요.',
          type: 'password',
          placeholder: '비밀번호',
          confirmLabel: '삭제',
          danger: true,
        });
        if (!password) {
          return;
        }
      }

      await deleteComment(id, password)
      .then(() => {
        this.$emit('deleted', id);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      });
    },
    async writeReply(submission: CommentSubmission, done: CommentDoneCallback) {
      if (!this.simpleComment?.id) {
        done(false);
        return;
      }
      const request = this.isLoggedIn
          ? createCommentToComment(this.simpleComment.id, { content: submission.content })
          : createGuestCommentToComment(this.simpleComment.id, {
            content: submission.content,
            name: submission.name,
            password: submission.password,
          });
      await request
      .then((comment) => {
        this.nestedComments.push(Object.assign(comment, {
          childrenCount: comment.children.length,
        }));
        this.onCommentChanged();
        done(true);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
        done(false);
      });
    },
    async toggleNestedReplies() {
      if (!this.simpleComment?.id) {
        return;
      }
      this.isNestedCommentsOpened = !this.isNestedCommentsOpened;
      if (this.isNestedCommentsOpened && !this.isNestedCommentsLoaded) {
        this.isLoadingReplies = true;
        await getComment(this.simpleComment.id)
        .then((comment) => {
          this.nestedComments = comment.children;
          this.isNestedCommentsLoaded = true;
        })
        .catch((error: HttpApiError) => {
          toast.error(error.getErrorMessage());
          this.isNestedCommentsOpened = false;
        })
        .finally(() => {
          this.isLoadingReplies = false;
        });
      }
    },
    commentDeleted(commentId: string) {
      this.nestedComments = this.nestedComments.filter((x) => x.id !== commentId);
      this.onCommentChanged();
    },
    async toggleCommentLike() {
      if (!this.simpleComment?.id) {
        return;
      }
      if (!this.isLoggedIn) {
        toast.info('좋아요를 누르려면 로그인이 필요합니다.');
        return;
      }
      const id = this.simpleComment.id;
      const request = this.isLiked ? unlikeComment(id) : likeComment(id);
      await request
      .then(() => {
        this.isLiked = !this.isLiked;
        this.likeCount = Math.max(0, this.likeCount + (this.isLiked ? 1 : -1));
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      });
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
        createdAt: this.simpleComment.createdAt,
        likeCount: this.likeCount,
      } as SimpleCommentDto);
    },
  },
  created() {
    this.content = this.simpleComment?.content ?? '';
    this.likeCount = this.simpleComment?.likeCount ?? 0;
    if (this.isLoggedIn && this.simpleComment?.id) {
      isCommentLiked(this.simpleComment.id)
      .then((liked) => {
        this.isLiked = liked;
      })
      .catch(() => {
        // 좋아요 여부 조회 실패는 무시한다.
      });
    }
  },
});
</script>

<style scoped>
.comment {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-3);
  padding: var(--s-5) 0;
  border-bottom: 1px solid var(--border);
}

.comment.reply {
  padding: var(--s-4) 0 0;
  border-bottom: none;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  margin-top: 2px;
}

.reply .comment-avatar {
  width: 28px;
  height: 28px;
}

.comment-body {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}

.comment-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
}

.name {
  font-weight: 700;
  color: var(--text);
}

a.name:hover {
  text-decoration: underline;
}

.time {
  color: var(--text-3);
  font-size: var(--text-xs);
}

.content {
  line-height: 1.65;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.markdown-content :deep(p) {
  margin: 0 0 0.5em;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(pre) {
  background: var(--code-bg);
  border: 1px solid var(--border);
  padding: 0.75em 1em;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  font-size: var(--text-sm);
  margin: 0.5em 0;
}

.markdown-content :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--code-bg);
  border-radius: 4px;
  padding: 0.1em 0.35em;
}

.markdown-content :deep(pre code) {
  padding: 0;
  background: transparent;
}

.markdown-content :deep(a) {
  color: var(--accent-text);
  text-decoration: underline;
}

.markdown-content :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--border-strong);
  padding-left: 0.8em;
  color: var(--text-2);
  margin: 0.5em 0;
}

.edit-box {
  display: grid;
  gap: var(--s-2);
}

.edit-box .textarea {
  min-height: 0;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--s-2);
}

.comment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-left: -8px;
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  color: var(--text-3);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background-color var(--ease), color var(--ease);
}

.action:hover {
  background: var(--hover-color);
  color: var(--text);
}

.action.liked {
  color: var(--like);
}

.action.liked .app-icon {
  fill: currentColor;
}

.action.danger:hover {
  color: var(--danger);
  background: var(--danger-soft);
}

.replies {
  display: grid;
  gap: var(--s-2);
  margin-top: var(--s-2);
  padding-left: var(--s-4);
  border-left: 2px solid var(--border);
}

.replies > .composer {
  margin-top: var(--s-3);
}

.replies-loading {
  padding: var(--s-2) 0;
}

@media (max-width: 500px) {
  .comment {
    gap: var(--s-2);
  }

  .comment-avatar {
    width: 30px;
    height: 30px;
  }

  .replies {
    padding-left: var(--s-2);
  }
}
</style>
