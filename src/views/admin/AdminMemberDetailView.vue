<template>
  <div class="member-detail">
    <router-link class="back subtle small" to="/admin/members"><app-icon name="arrow-left" :size="14"/>회원 목록</router-link>

    <template v-if="detail">
      <div class="page-head">
        <div>
          <h1>
            {{ detail.account.name }}
            <span class="badge" :class="detail.account.deleted ? 'badge-danger' : 'badge-success'">{{ detail.account.deleted ? '정지' : '활성' }}</span>
          </h1>
          <p class="lead">
            <span class="mono">{{ detail.account.email }}</span> ·
            <router-link :to="`/${detail.account.blogId}`">{{ detail.account.blogId }}</router-link> ·
            가입 {{ fullDate(detail.account.createdAt) }}
          </p>
        </div>
      </div>

      <div class="summary">
        <div class="card stat"><div class="subtle small">글</div><div class="stat-value num">{{ n(detail.postCount) }}</div></div>
        <div class="card stat"><div class="subtle small">댓글</div><div class="stat-value num">{{ n(detail.commentCount) }}</div></div>
        <div class="card stat"><div class="subtle small">글 조회수 합</div><div class="stat-value num">{{ n(detail.totalHits) }}</div></div>
        <div class="card stat" :class="{ warn: detail.reportedCount > 0 }">
          <div class="subtle small">신고된 횟수</div><div class="stat-value num">{{ n(detail.reportedCount) }}</div>
        </div>
        <div class="card stat"><div class="subtle small">신고한 횟수</div><div class="stat-value num">{{ n(detail.reportCount) }}</div></div>
      </div>

      <section class="card flush">
        <div class="card-head"><h2>최근 글</h2><span class="subtle small">최근 {{ detail.recentPosts.length }}개</span></div>
        <ul class="rows">
          <li v-for="post in detail.recentPosts" :key="post.id" class="row">
            <div class="row-body">
              <router-link class="row-title" :to="`/${post.author.blogId}/posts/${post.postUrl}`">{{ post.title || '(제목 없음)' }}</router-link>
              <span v-if="post.openType !== 'PUBLIC'" class="badge">{{ openTypeLabel(post.openType) }}</span>
            </div>
            <span class="subtle small num">조회 {{ n(post.hits) }} · 댓글 {{ n(post.commentCount) }} · {{ ago(post.createdAt) }}</span>
          </li>
          <li v-if="detail.recentPosts.length === 0" class="empty">쓴 글이 없습니다.</li>
        </ul>
      </section>

      <section class="card flush">
        <div class="card-head"><h2>최근 댓글</h2><span class="subtle small">최근 {{ detail.recentComments.length }}개</span></div>
        <ul class="rows">
          <li v-for="comment in detail.recentComments" :key="comment.id" class="row comment-row">
            <div class="comment-content">{{ comment.content }}</div>
            <div class="subtle small">
              <router-link v-if="comment.postBlogId && comment.postUrl" :to="`/${comment.postBlogId}/posts/${comment.postUrl}#comment-${comment.id}`">
                {{ comment.postTitle }}
              </router-link>
              · {{ ago(comment.createdAt) }}
            </div>
          </li>
          <li v-if="detail.recentComments.length === 0" class="empty">쓴 댓글이 없습니다.</li>
        </ul>
      </section>
    </template>

    <div v-if="isLoading && !detail" class="loading"><loading-spinner/></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminAccountDetailDto } from '@/api/models/admin.dtos';
import { getAccountDetail } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import AppIcon from '@/components/common/AppIcon.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { toast } from '@/utils/dialog';
import { formatCount, formatDateTime, formatRelativeDate } from '@/utils/format';

export default defineComponent({
  name: 'AdminMemberDetailView',
  components: { AppIcon, LoadingSpinner },
  props: {
    accountId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      detail: null as AdminAccountDetailDto | null,
      isLoading: false,
    };
  },
  watch: {
    accountId() {
      this.load();
    },
  },
  methods: {
    n: formatCount,
    ago: formatRelativeDate,
    fullDate: formatDateTime,
    openTypeLabel(openType: string): string {
      return openType === 'PRIVATE' ? '비공개' : openType === 'DRAFT' ? '임시저장' : openType === 'SCHEDULED' ? '예약' : openType;
    },
    async load() {
      this.isLoading = true;
      await getAccountDetail(this.accountId)
      .then((detail) => {
        this.detail = detail;
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.member-detail {
  display: grid;
  gap: var(--s-5);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-self: start;
}

.page-head h1 {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  flex-wrap: wrap;
}

.summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--s-3);
}

.stat {
  padding: var(--s-4);
  display: grid;
  gap: 4px;
}

.stat-value {
  font-size: var(--text-xl);
  font-weight: 800;
}

.stat.warn .stat-value {
  color: var(--danger);
}

.rows {
  display: grid;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-5);
  border-bottom: 1px solid var(--border);
}

.row:last-child {
  border-bottom: none;
}

.row-body {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.row-title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comment-row {
  display: grid;
  gap: 4px;
  justify-content: stretch;
}

.comment-content {
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.empty {
  justify-content: center;
  color: var(--text-3);
  padding: var(--s-8);
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--s-10);
}

@media (max-width: 860px) {
  .summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
