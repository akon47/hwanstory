<template>
  <div class="audit">
    <div class="page-head">
      <div>
        <h1>활동 기록</h1>
        <p class="lead">관리자가 바꾼 것(정지·삭제·권한·공지·신고 처리)이 누가 언제 했는지와 함께 남습니다. 지우거나 고칠 수 없습니다.</p>
      </div>
    </div>

    <div class="card flush">
      <ul class="log-list">
        <li v-for="log in page?.data ?? []" :key="log.id" class="log-row">
          <span class="badge" :class="badgeClass(log.action)">{{ actionLabel(log.action) }}</span>
          <div class="log-body">
            <div class="log-summary">{{ log.summary || log.action }}</div>
            <div class="subtle small">
              {{ log.actorName || log.actorEmail || '알 수 없음' }}
              <template v-if="log.actorName && log.actorEmail"> · {{ log.actorEmail }}</template>
            </div>
          </div>
          <span class="subtle small num log-time" :title="fullDate(log.createdAt)">{{ ago(log.createdAt) }}</span>
        </li>
        <li v-if="!isLoading && page && page.data.length === 0" class="empty">아직 기록이 없습니다.</li>
      </ul>
      <div class="card-foot pager">
        <span class="subtle small">전체 {{ n(page?.totalElements ?? 0) }}건</span>
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
import { AdminAuditLogDto } from '@/api/models/admin.dtos';
import { PageDto } from '@/api/models/common.dtos';
import { getAuditLogs } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import AppIcon from '@/components/common/AppIcon.vue';
import { toast } from '@/utils/dialog';
import { formatCount, formatDateTime, formatRelativeDate } from '@/utils/format';

// 행동 종류별 표시 이름 (백엔드 AdminAuditService.record 의 action 값)
const ACTION_LABELS: Record<string, string> = {
  ACCOUNT_DISABLE: '회원 정지',
  ACCOUNT_RESTORE: '정지 해제',
  ROLE_GRANT_ADMIN: '관리자 지정',
  ROLE_REVOKE_ADMIN: '관리자 해제',
  POST_OPEN_TYPE: '공개 유형',
  POST_DELETE: '글 삭제',
  COMMENT_DELETE: '댓글 삭제',
  TOKEN_REVOKE: '토큰 폐기',
  ANNOUNCEMENT_UPDATE: '공지',
  REPORT_RESOLVED: '신고 처리',
  REPORT_DISMISSED: '신고 기각',
  REPORT_OPEN: '신고 다시 열기',
  REPORT_DELETE_TARGET: '신고 대상 삭제',
};

export default defineComponent({
  name: 'AdminAuditView',
  components: { AppIcon },
  data() {
    return {
      page: null as PageDto<AdminAuditLogDto> | null,
      pageIndex: 0,
      isLoading: false,
    };
  },
  methods: {
    n: formatCount,
    ago: formatRelativeDate,
    fullDate: formatDateTime,
    actionLabel(action: string): string {
      return ACTION_LABELS[action] ?? action;
    },
    // 지우거나 막는 행동은 눈에 띄게, 되돌리는 행동은 차분하게
    badgeClass(action: string): string {
      if (/DELETE|DISABLE|REVOKE/.test(action)) return 'badge-danger';
      if (/GRANT|OPEN_TYPE|ANNOUNCEMENT/.test(action)) return 'badge-warning';
      return 'badge-success';
    },
    async load() {
      this.isLoading = true;
      await getAuditLogs(this.pageIndex, 30)
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
    go(index: number) {
      this.pageIndex = Math.max(0, index);
      this.load();
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.audit {
  display: grid;
  gap: var(--s-5);
}

.log-list {
  display: grid;
}

.log-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) auto;
  gap: var(--s-3);
  align-items: start;
  padding: var(--s-3) var(--s-5);
  border-bottom: 1px solid var(--border);
}

.log-row .badge {
  justify-self: start;
}

.log-body {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.log-summary {
  overflow-wrap: anywhere;
  line-height: 1.5;
}

.log-time {
  white-space: nowrap;
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

@media (max-width: 600px) {
  .log-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .log-row .badge {
    grid-column: 1 / -1;
  }
}
</style>
