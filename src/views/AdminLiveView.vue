<template>
  <div class="admin-container">
    <h1>관리자</h1>

    <nav class="admin-tabs">
      <router-link to="/admin" class="tab">회원 관리</router-link>
      <router-link to="/admin/live" class="tab">실시간 접속</router-link>
    </nav>

    <div class="summary">
      <span class="summary-item">전체 접속 <strong>{{ totalSessions }}</strong></span>
      <span class="summary-sep">·</span>
      <span class="summary-item">글 보는 중 <strong>{{ viewers.length }}</strong></span>
      <span class="refresh-hint">3초마다 자동 갱신</span>
    </div>

    <div class="table-wrapper">
      <table class="viewer-table">
        <thead>
        <tr>
          <th>보고 있는 글</th>
          <th>IP</th>
          <th>사용자</th>
          <th>기기 (User-Agent)</th>
          <th>접속 시각</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(viewer, index) in viewers" :key="index">
          <td>
            <router-link v-if="viewer.blogId && viewer.postUrl"
                         :to="{ path: `/${viewer.blogId}/posts/${viewer.postUrl}` }">
              {{ viewer.postTitle || '(제목 없음)' }}
            </router-link>
            <span v-else class="muted">(비공개·삭제된 글)</span>
          </td>
          <td class="ip">{{ viewer.ip }}</td>
          <td>
            <template v-if="viewer.memberName || viewer.memberEmail">
              <span class="member-name">{{ viewer.memberName || viewer.memberEmail }}</span>
              <span v-if="viewer.memberName && viewer.memberEmail" class="member-email">{{ viewer.memberEmail }}</span>
            </template>
            <span v-else class="badge-guest">게스트</span>
          </td>
          <td class="user-agent" :title="viewer.userAgent">{{ viewer.userAgent }}</td>
          <td>{{ formatTime(viewer.connectedAt) }}</td>
        </tr>
        <tr v-if="!isLoading && viewers.length === 0">
          <td colspan="5" class="empty">현재 글을 보고 있는 접속자가 없습니다.</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div v-if="isLoading" class="loading">
        <loading-spinner/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminActiveViewerDto } from '@/api/models/admin.dtos';
import { getActiveViewers } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

// 폴링 주기(ms)
const REFRESH_INTERVAL = 3000;

export default defineComponent({
  name: 'AdminLiveView',
  components: { LoadingSpinner },
  data() {
    return {
      totalSessions: 0,
      viewers: Array<AdminActiveViewerDto>(),
      isLoading: false,
      refreshTimer: null as ReturnType<typeof setInterval> | null,
    };
  },
  methods: {
    formatTime(value: Date | null): string {
      if (!value) {
        return '';
      }
      const date = new Date(value);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    // showSpinner: 최초 로딩에서만 스피너를 표시하고, 주기적 갱신에서는 깜빡임을 방지한다.
    async fetchActiveViewers(showSpinner = false) {
      if (showSpinner) {
        this.isLoading = true;
      }
      await getActiveViewers()
      .then((result) => {
        this.totalSessions = result.totalSessions;
        this.viewers = result.viewers;
      })
      .catch((error: HttpApiError) => {
        // 주기적 갱신 중 일시적 오류는 화면을 어지럽히지 않도록 최초 로딩에서만 알린다.
        if (showSpinner) {
          alert(error.getErrorMessage());
        }
      })
      .finally(() => {
        if (showSpinner) {
          this.isLoading = false;
        }
      });
    },
  },
  mounted() {
    this.fetchActiveViewers(true);
    this.refreshTimer = setInterval(() => this.fetchActiveViewers(), REFRESH_INTERVAL);
  },
  beforeUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },
});
</script>

<style scoped>

.admin-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--base-gap);
  box-sizing: border-box;
}

h1 {
  margin-bottom: var(--base-gap);
}

.admin-tabs {
  display: flex;
  gap: var(--half-base-gab);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--base-gap);
}

.admin-tabs .tab {
  padding: 8px 14px;
  color: var(--base-color);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.admin-tabs .tab.router-link-exact-active {
  border-bottom-color: var(--button-color);
  font-weight: bold;
}

.summary {
  display: flex;
  align-items: center;
  gap: var(--half-base-gab);
  margin-bottom: var(--base-gap);
  font-size: 0.95em;
}

.summary-sep {
  opacity: 0.4;
}

.refresh-hint {
  margin-left: auto;
  font-size: 0.8em;
  opacity: 0.5;
}

.table-wrapper {
  overflow-x: auto;
}

.viewer-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.viewer-table th,
.viewer-table td {
  border-bottom: 1px solid var(--border-color);
  padding: 10px 8px;
  text-align: left;
  white-space: nowrap;
}

.viewer-table a {
  color: var(--link-accent-color);
}

.ip {
  font-family: monospace;
}

.member-name {
  display: block;
}

.member-email {
  display: block;
  font-size: 0.8em;
  opacity: 0.6;
}

.user-agent {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-guest {
  opacity: 0.6;
}

.muted {
  opacity: 0.5;
}

.empty {
  text-align: center;
  padding: 2em 0;
  opacity: 0.6;
}

.footer {
  display: flex;
  justify-content: center;
  margin-top: var(--base-gap);
  min-height: 50px;
}

.loading {
  display: flex;
  justify-content: center;
  height: 50px;
}

</style>
