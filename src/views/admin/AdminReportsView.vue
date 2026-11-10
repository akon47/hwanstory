<template>
  <div class="reports">
    <div class="page-head">
      <div>
        <h1>신고</h1>
        <p class="lead">방문자가 신고한 글과 댓글입니다. 내용을 확인하고 지우거나, 문제가 없으면 기각하세요.</p>
      </div>
    </div>

    <div class="filters" role="tablist" aria-label="처리 상태">
      <button v-for="filter in filters" :key="filter.label" class="chip filter-chip" :class="{ selected: status === filter.value }"
              type="button" role="tab" :aria-selected="status === filter.value" @click="setStatus(filter.value)">
        {{ filter.label }}
      </button>
    </div>

    <div class="card flush">
      <ul class="report-list">
        <li v-for="report in page?.data ?? []" :key="report.id" class="report-row">
          <div class="report-body">
            <div class="report-head">
              <span class="badge" :class="statusBadge(report.status)">{{ statusLabel(report.status) }}</span>
              <span class="badge">{{ report.targetType === 'POST' ? '글' : '댓글' }}</span>
              <span class="badge badge-warning">{{ reasonLabel(report.reason) }}</span>
              <span class="subtle small" :title="fullDate(report.createdAt)">{{ ago(report.createdAt) }}</span>
            </div>
            <div class="report-target">
              <router-link v-if="report.targetExists && report.targetPath" class="target-link"
                           :to="targetLink(report)">{{ report.targetSummary || '(내용 없음)' }}</router-link>
              <span v-else class="target-gone">{{ report.targetSummary || '(내용 없음)' }}</span>
              <span v-if="!report.targetExists" class="badge">삭제됨</span>
            </div>
            <div v-if="report.detail" class="report-detail">“{{ report.detail }}”</div>
            <div class="subtle small">
              신고한 사람: {{ report.reporterName || '손님' }}
              <template v-if="report.reporterEmail"> · {{ report.reporterEmail }}</template>
              <template v-if="report.reporterIp"> · <span class="mono">{{ report.reporterIp }}</span></template>
              <template v-if="report.handledBy"> · 처리: {{ report.handledBy }} ({{ ago(report.handledAt) }})</template>
            </div>
          </div>
          <div class="report-actions">
            <template v-if="report.status === 'OPEN'">
              <button v-if="report.targetExists" class="btn btn-danger btn-sm" type="button" :disabled="isBusy"
                      @click="removeTarget(report)">{{ report.targetType === 'POST' ? '글 삭제' : '댓글 삭제' }}</button>
              <button class="btn btn-secondary btn-sm" type="button" :disabled="isBusy" @click="handle(report, 'RESOLVED')">처리 완료</button>
              <button class="btn btn-ghost btn-sm" type="button" :disabled="isBusy" @click="handle(report, 'DISMISSED')">기각</button>
            </template>
            <button v-else class="btn btn-ghost btn-sm" type="button" :disabled="isBusy" @click="handle(report, 'OPEN')">다시 열기</button>
          </div>
        </li>
        <li v-if="!isLoading && page && page.data.length === 0" class="empty">
          {{ status === 'OPEN' ? '처리할 신고가 없습니다.' : '신고가 없습니다.' }}
        </li>
      </ul>
      <div class="card-foot pager">
        <span class="subtle small">{{ n(page?.totalElements ?? 0) }}건</span>
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
import { AdminReportDto } from '@/api/models/admin.dtos';
import { PageDto } from '@/api/models/common.dtos';
import { ReportReason, reportReasonLabel, ReportStatus } from '@/api/models/site.dtos';
import { getReports, handleReport } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import AppIcon from '@/components/common/AppIcon.vue';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatCount, formatDateTime, formatRelativeDate } from '@/utils/format';

export default defineComponent({
  name: 'AdminReportsView',
  components: { AppIcon },
  emits: ['changed'],
  data() {
    return {
      page: null as PageDto<AdminReportDto> | null,
      pageIndex: 0,
      status: 'OPEN' as ReportStatus | null,
      filters: [
        { value: 'OPEN', label: '처리 대기' },
        { value: 'RESOLVED', label: '처리 완료' },
        { value: 'DISMISSED', label: '기각' },
        { value: null, label: '전체' },
      ] as Array<{ value: ReportStatus | null; label: string }>,
      isLoading: false,
      isBusy: false,
    };
  },
  methods: {
    n: formatCount,
    ago: formatRelativeDate,
    fullDate: formatDateTime,
    reasonLabel(reason: ReportReason): string {
      return reportReasonLabel(reason);
    },
    statusLabel(status: ReportStatus): string {
      return status === 'OPEN' ? '처리 대기' : status === 'RESOLVED' ? '처리 완료' : '기각';
    },
    statusBadge(status: ReportStatus): string {
      return status === 'OPEN' ? 'badge-danger' : status === 'RESOLVED' ? 'badge-success' : '';
    },
    // 댓글 신고는 그 댓글 위치로 바로 가도록 해시를 붙인다.
    targetLink(report: AdminReportDto): string {
      return report.targetType === 'COMMENT' ? `${report.targetPath}#comment-${report.targetId}` : (report.targetPath ?? '/');
    },
    async load() {
      this.isLoading = true;
      await getReports(this.pageIndex, 20, this.status)
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
    setStatus(status: ReportStatus | null) {
      this.status = status;
      this.pageIndex = 0;
      this.load();
    },
    go(index: number) {
      this.pageIndex = Math.max(0, index);
      this.load();
    },
    async handle(report: AdminReportDto, status: ReportStatus, deleteTarget = false) {
      this.isBusy = true;
      await handleReport(report.id, status, deleteTarget)
      .then(() => {
        toast.success(deleteTarget ? '삭제하고 신고를 처리했습니다.'
          : status === 'RESOLVED' ? '처리 완료로 표시했습니다.'
            : status === 'DISMISSED' ? '신고를 기각했습니다.' : '신고를 다시 열었습니다.');
        this.$emit('changed');
        this.load();
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isBusy = false;
      });
    },
    async removeTarget(report: AdminReportDto) {
      const kind = report.targetType === 'POST' ? '글' : '댓글';
      const ok = await confirmDialog({
        title: `신고된 ${kind}을 삭제할까요?`,
        message: `${(report.targetSummary ?? '').slice(0, 100)}\n\n같은 ${kind}에 걸린 다른 신고도 함께 처리 완료가 됩니다.`,
        confirmLabel: '삭제',
        danger: true,
      });
      if (ok) {
        await this.handle(report, 'RESOLVED', true);
      }
    },
  },
  mounted() {
    this.load();
  },
});
</script>

<style scoped>
.reports {
  display: grid;
  gap: var(--s-5);
}

.filters {
  display: flex;
  gap: var(--s-2);
  flex-wrap: wrap;
}

/* 고르지 않은 것은 차분하게, 고른 것만 강조색으로 채워 한눈에 구분되게 한다 */
.filter-chip {
  cursor: pointer;
  background: var(--surface-2);
  color: var(--text-2);
  border: 1px solid var(--border);
}

.filter-chip.selected {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

.report-list {
  display: grid;
}

.report-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-4);
  align-items: start;
  padding: var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--border);
}

.report-body {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.report-head,
.report-target {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.target-link,
.target-gone {
  font-weight: 700;
  overflow-wrap: anywhere;
}

.target-gone {
  color: var(--text-3);
  text-decoration: line-through;
}

.report-detail {
  color: var(--text-2);
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.report-actions {
  display: flex;
  gap: var(--s-2);
  flex-wrap: wrap;
  justify-content: flex-end;
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

@media (max-width: 700px) {
  .report-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .report-actions {
    justify-content: flex-start;
  }
}
</style>
