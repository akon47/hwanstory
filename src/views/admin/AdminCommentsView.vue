<template>
  <div class="comments">
    <div class="page-head">
      <div>
        <h1>댓글</h1>
        <p class="lead">모든 글의 댓글을 최신순으로 봅니다. 스팸이나 문제가 있는 댓글은 바로 지울 수 있어요.</p>
      </div>
    </div>

    <form class="toolbar" @submit.prevent="applySearch">
      <div class="search-box">
        <app-icon class="search-icon" name="search" :size="18"/>
        <input v-model="search" class="input" type="search" placeholder="내용 · 작성자 · 글 제목으로 찾기"/>
      </div>
      <button class="btn" type="submit">검색</button>
    </form>

    <div class="card flush">
      <ul class="comment-list">
        <li v-for="comment in page?.data ?? []" :key="comment.id" class="comment-row">
          <span class="avatar comment-avatar" :style="avatarStyle(comment)"/>
          <div class="comment-body">
            <div class="comment-head">
              <span class="comment-author">{{ comment.author?.name }}</span>
              <span v-if="comment.author?.guest" class="badge">손님</span>
              <span v-if="comment.parentId" class="badge">답글</span>
              <span class="subtle small" :title="fullDate(comment.createdAt)">{{ ago(comment.createdAt) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <router-link v-if="comment.postBlogId && comment.postUrl" class="comment-post small"
                         :to="`/${comment.postBlogId}/posts/${comment.postUrl}#comment-${comment.id}`">
              <app-icon name="file-text" :size="14"/>{{ comment.postTitle }}
            </router-link>
          </div>
          <button class="btn btn-danger-ghost btn-sm" type="button" :disabled="isBusy" @click="remove(comment)">삭제</button>
        </li>
        <li v-if="!isLoading && page && page.data.length === 0" class="empty">조건에 맞는 댓글이 없습니다.</li>
      </ul>
      <div class="card-foot pager">
        <span class="subtle small">전체 {{ n(page?.totalElements ?? 0) }}개</span>
        <div class="pager-buttons">
          <button class="btn btn-secondary btn-sm" type="button" :disabled="pageIndex === 0 || isLoading" @click="go(pageIndex - 1)">
            <app-icon name="chevron-left" :size="16"/>이전
          </button>
          <span class="small num">{{ pageIndex + 1 }} / {{ Math.max(1, page?.totalPages ?? 1) }}</span>
          <button class="btn btn-secondary btn-sm" type="button" :disabled="!page || pageIndex + 1 >= page.totalPages || isLoading" @click="go(pageIndex + 1)">
            다음<app-icon name="chevron-right" :size="16"/>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminCommentDto } from '@/api/models/admin.dtos';
import { PageDto } from '@/api/models/common.dtos';
import { deleteComment, getComments } from '@/api/admin';
import { attachmentFileBaseUrl, HttpApiError } from '@/api/common/httpApiClient';
import AppIcon from '@/components/common/AppIcon.vue';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatCount, formatDateTime, formatRelativeDate } from '@/utils/format';

export default defineComponent({
  name: 'AdminCommentsView',
  components: { AppIcon },
  data() {
    return {
      page: null as PageDto<AdminCommentDto> | null,
      pageIndex: 0,
      search: '',
      appliedSearch: '',
      isLoading: false,
      isBusy: false,
    };
  },
  methods: {
    n: formatCount,
    ago: formatRelativeDate,
    fullDate: formatDateTime,
    avatarStyle(comment: AdminCommentDto) {
      const url = comment.author?.profileImageUrl ? `${attachmentFileBaseUrl}${comment.author.profileImageUrl}` : require('@/assets/profile.svg');
      return { backgroundImage: `url(${url})` };
    },
    async load() {
      this.isLoading = true;
      await getComments(this.pageIndex, 20, this.appliedSearch || null)
      .then((page) => {
        this.page = page;
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    applySearch() {
      this.appliedSearch = this.search.trim();
      this.pageIndex = 0;
      this.load();
    },
    go(index: number) {
      this.pageIndex = Math.max(0, index);
      this.load();
    },
    async remove(comment: AdminCommentDto) {
      const ok = await confirmDialog({
        title: '댓글을 삭제할까요?',
        message: `${comment.author?.name}: ${comment.content.slice(0, 80)}`,
        confirmLabel: '삭제',
        danger: true,
      });
      if (!ok) {
        return;
      }
      this.isBusy = true;
      await deleteComment(comment.id)
      .then(() => {
        toast.success('댓글을 삭제했습니다.');
        this.load();
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isBusy = false;
      });
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.comments {
  display: grid;
  gap: var(--s-5);
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-2);
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}

.search-box .input {
  padding-left: 38px;
}

.comment-list {
  display: grid;
}

.comment-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--s-3);
  align-items: start;
  padding: var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--border);
}

.comment-avatar {
  width: 32px;
  height: 32px;
}

.comment-body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 700;
}

.comment-content {
  color: var(--text);
  line-height: 1.55;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.comment-post {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.empty {
  text-align: center;
  color: var(--text-3);
  padding: var(--s-10);
}

.pager {
  justify-content: space-between;
  align-items: center;
}

.pager-buttons {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
</style>
