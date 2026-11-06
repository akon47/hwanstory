<template>
  <div class="live">
    <div class="page-head">
      <div>
        <h1>실시간 접속</h1>
        <p class="lead">지금 누가 어떤 글을 읽고 있는지 봅니다. 3초마다 자동으로 새로고침합니다.</p>
      </div>
      <div class="summary">
        <span class="badge badge-success"><span class="live-dot"/>전체 접속 {{ totalSessions }}</span>
        <span class="badge">글 읽는 중 {{ viewers.length }}</span>
      </div>
    </div>

    <div class="card flush">
      <div class="table-wrapper">
        <table class="table">
          <thead>
          <tr>
            <th>보고 있는 글</th>
            <th>사용자</th>
            <th>IP</th>
            <th>기기</th>
            <th>접속 시각</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(viewer, index) in viewers" :key="index">
            <td class="post-cell">
              <router-link v-if="viewer.blogId && viewer.postUrl" :to="`/${viewer.blogId}/posts/${viewer.postUrl}`" class="post-link">
                {{ viewer.postTitle || '(제목 없음)' }}
              </router-link>
              <span v-else class="subtle">(비공개·삭제된 글)</span>
            </td>
            <td>
              <template v-if="viewer.memberName || viewer.memberEmail">
                <div class="member-name">{{ viewer.memberName || viewer.memberEmail }}</div>
                <div v-if="viewer.memberName && viewer.memberEmail" class="subtle tiny">{{ viewer.memberEmail }}</div>
              </template>
              <span v-else class="badge">손님</span>
            </td>
            <td class="mono small">{{ viewer.ip }}</td>
            <td class="ua small" :title="viewer.userAgent">{{ shortUserAgent(viewer.userAgent) }}</td>
            <td class="small num">{{ formatTime(viewer.connectedAt) }}</td>
          </tr>
          <tr v-if="!isLoading && viewers.length === 0">
            <td colspan="5" class="empty">지금 글을 읽고 있는 접속자가 없습니다.</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminActiveViewerDto } from '@/api/models/admin.dtos';
import { getActiveViewers } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import { toast } from '@/utils/dialog';

// 폴링 주기(ms)
const REFRESH_INTERVAL = 3000;

export default defineComponent({
  name: 'AdminLiveView',
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
    // User-Agent 에서 브라우저·OS 만 짧게 뽑는다.
    shortUserAgent(ua: string): string {
      if (!ua) return '';
      const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
      const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : /bot|crawl|spider/i.test(ua) ? '봇' : '';
      return [browser, os].filter(Boolean).join(' · ') || ua.slice(0, 40);
    },
    // showSpinner: 최초 로딩에서만 오류를 알리고, 주기적 갱신 중 일시 오류는 조용히 넘긴다.
    async fetchActiveViewers(notifyError = false) {
      this.isLoading = true;
      await getActiveViewers()
      .then((result) => {
        this.totalSessions = result.totalSessions;
        this.viewers = result.viewers;
      })
      .catch((error: HttpApiError) => {
        if (notifyError) {
          toast.error(error.getErrorMessage());
        }
      })
      .finally(() => {
        this.isLoading = false;
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
.live {
  display: grid;
  gap: var(--s-5);
}

.summary {
  display: flex;
  gap: var(--s-2);
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  margin-right: 2px;
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

.post-cell {
  max-width: 360px;
}

.post-link {
  color: var(--text);
  font-weight: 600;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-name {
  font-weight: 600;
}

.ua {
  color: var(--text-2);
}

.empty {
  text-align: center;
  color: var(--text-3);
  padding: var(--s-10) !important;
}
</style>
