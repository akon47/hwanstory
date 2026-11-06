<template>
  <div class="posts">
    <div class="page-head">
      <div>
        <h1>글</h1>
        <p class="lead">비공개·임시저장·예약 글까지 모두 봅니다. 문제가 있는 글은 비공개로 돌리거나 지울 수 있어요.</p>
      </div>
    </div>

    <form class="toolbar" @submit.prevent="applySearch">
      <div class="search-box">
        <app-icon class="search-icon" name="search" :size="18"/>
        <input v-model="search" class="input" type="search" placeholder="제목 · 작성자 이름 · 블로그 주소로 찾기"/>
      </div>
      <select v-model="openType" class="select filter" aria-label="공개 유형" @change="applySearch">
        <option value="">모든 유형</option>
        <option value="PUBLIC">공개</option>
        <option value="PRIVATE">비공개</option>
        <option value="DRAFT">임시저장</option>
        <option value="SCHEDULED">예약 발행</option>
      </select>
      <button class="btn" type="submit">검색</button>
    </form>

    <div class="card flush">
      <div class="table-wrapper">
        <table class="table">
          <thead>
          <tr>
            <th>글</th>
            <th>작성자</th>
            <th>유형</th>
            <th class="num">조회</th>
            <th class="num">좋아요</th>
            <th class="num">댓글</th>
            <th>작성</th>
            <th class="right">관리</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="post in page?.data ?? []" :key="post.id">
            <td class="title-cell">
              <router-link class="post-title" :to="`/${post.author.blogId}/posts/${post.postUrl}`">{{ post.title }}</router-link>
              <span class="subtle tiny mono">/{{ post.postUrl }}</span>
            </td>
            <td>
              <router-link :to="`/${post.author.blogId}`" class="author">{{ post.author.name }}</router-link>
            </td>
            <td>
              <select class="select type-select" :value="post.openType" :disabled="isBusy" aria-label="공개 유형 변경"
                      @change="changeType(post, ($event.target as HTMLSelectElement).value)">
                <option value="PUBLIC">공개</option>
                <option value="PRIVATE">비공개</option>
                <option value="DRAFT">임시저장</option>
                <option value="SCHEDULED">예약 발행</option>
              </select>
            </td>
            <td class="num">{{ n(post.hits) }}</td>
            <td class="num">{{ n(post.likeCount) }}</td>
            <td class="num">{{ n(post.commentCount) }}</td>
            <td class="small" :title="fullDate(post.createdAt)">{{ ago(post.createdAt) }}</td>
            <td class="right">
              <button class="btn btn-danger-ghost btn-sm" type="button" :disabled="isBusy" @click="remove(post)">삭제</button>
            </td>
          </tr>
          <tr v-if="!isLoading && page && page.data.length === 0">
            <td colspan="8" class="empty">조건에 맞는 글이 없습니다.</td>
          </tr>
          </tbody>
        </table>
      </div>
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
import { OpenType, SimplePostDto } from '@/api/models/blog.dtos';
import { PageDto } from '@/api/models/common.dtos';
import { changePostOpenType, deletePost, getPosts } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import AppIcon from '@/components/common/AppIcon.vue';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatCount, formatDateTime, formatRelativeDate } from '@/utils/format';

export default defineComponent({
  name: 'AdminPostsView',
  components: { AppIcon },
  data() {
    return {
      page: null as PageDto<SimplePostDto> | null,
      pageIndex: 0,
      search: '',
      appliedSearch: '',
      openType: '' as OpenType | '',
      isLoading: false,
      isBusy: false,
    };
  },
  methods: {
    n: formatCount,
    ago: formatRelativeDate,
    fullDate: formatDateTime,
    async load() {
      this.isLoading = true;
      await getPosts(this.pageIndex, 20, this.appliedSearch || null, this.openType || null)
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
    async changeType(post: SimplePostDto, value: string) {
      const openType = value as OpenType;
      if (openType === post.openType) {
        return;
      }
      this.isBusy = true;
      await changePostOpenType(post.id, openType)
      .then((updated) => {
        if (this.page) {
          const index = this.page.data.findIndex((x) => x.id === updated.id);
          if (index >= 0) {
            this.page.data.splice(index, 1, updated);
          }
        }
        toast.success('공개 유형을 바꿨습니다.');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
        this.load();
      })
      .finally(() => {
        this.isBusy = false;
      });
    },
    async remove(post: SimplePostDto) {
      const ok = await confirmDialog({
        title: '글을 삭제할까요?',
        message: `'${post.title}' (${post.author.name}) 글과 댓글이 사라지며 되돌릴 수 없습니다.`,
        confirmLabel: '삭제',
        danger: true,
      });
      if (!ok) {
        return;
      }
      this.isBusy = true;
      await deletePost(post.id)
      .then(() => {
        toast.success('글을 삭제했습니다.');
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
.posts {
  display: grid;
  gap: var(--s-5);
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
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

.filter {
  width: 140px;
}

.card.flush {
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table th,
.table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.table th {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--surface-2);
}

.table th.num,
.table td.num {
  text-align: right;
}

.table .right {
  text-align: right;
}

.title-cell {
  max-width: 420px;
  display: grid;
  gap: 2px;
}

.post-title {
  color: var(--text);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author {
  color: var(--text-2);
}

.type-select {
  min-height: 32px;
  padding: 4px 28px 4px 10px;
  font-size: var(--text-xs);
  width: auto;
}

.empty {
  text-align: center;
  color: var(--text-3);
  padding: var(--s-10) !important;
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

@media (max-width: 640px) {
  .toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .filter {
    width: 100%;
  }
}
</style>
