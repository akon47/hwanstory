<template>
  <div class="tokens">
    <div class="page-head">
      <div>
        <h1>액세스 토큰</h1>
        <p class="lead">모든 회원이 AI 에이전트·스크립트용으로 발급한 토큰입니다. 수상하면 바로 폐기하세요. 토큰 원문은 저장하지 않습니다.</p>
      </div>
      <button class="btn btn-secondary btn-sm" type="button" :disabled="isLoading" @click="load">새로고침</button>
    </div>

    <div class="summary">
      <span class="badge badge-success">사용 가능 {{ usableCount }}</span>
      <span class="badge">만료·폐기 {{ tokens.length - usableCount }}</span>
    </div>

    <div class="card flush">
      <div class="table-wrapper">
        <table class="table">
          <thead>
          <tr>
            <th>이름</th>
            <th>소유자</th>
            <th>권한</th>
            <th>발급</th>
            <th>마지막 사용</th>
            <th>만료</th>
            <th class="right">관리</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="token in tokens" :key="token.id" :class="{ muted: !token.usable }">
            <td>
              <div class="token-name">{{ token.name }}</div>
              <div class="subtle tiny mono">hsp_{{ token.tokenId }}_… · {{ token.origin === 'DEVICE' ? '기기 로그인' : '웹' }}</div>
            </td>
            <td>
              <router-link v-if="token.owner?.blogId" :to="`/${token.owner.blogId}`" class="owner">{{ token.owner.name }}</router-link>
              <div class="subtle tiny">{{ token.ownerEmail }}</div>
            </td>
            <td><span v-for="scope in token.scopes" :key="scope" class="badge badge-accent scope">{{ scope }}</span></td>
            <td class="small">{{ ago(token.createdAt) }}</td>
            <td class="small">
              <template v-if="token.lastUsedAt">{{ ago(token.lastUsedAt) }}<div class="subtle tiny mono">{{ token.lastUsedIp }}</div></template>
              <span v-else class="subtle">없음</span>
            </td>
            <td class="small">
              <span v-if="token.revokedAt" class="badge badge-danger">폐기됨</span>
              <span v-else-if="token.expired" class="badge">만료됨</span>
              <span v-else-if="token.expiresAt" :title="fullDate(token.expiresAt)">{{ until(token.expiresAt) }}</span>
              <span v-else>무기한</span>
            </td>
            <td class="right">
              <button v-if="token.usable" class="btn btn-danger-ghost btn-sm" type="button" :disabled="isLoading" @click="revoke(token)">폐기</button>
            </td>
          </tr>
          <tr v-if="!isLoading && tokens.length === 0">
            <td colspan="7" class="empty">발급된 토큰이 없습니다.</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminTokenDto } from '@/api/models/admin.dtos';
import { getTokens, revokeToken } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatDateTime, formatRelativeDate } from '@/utils/format';

export default defineComponent({
  name: 'AdminTokensView',
  data() {
    return {
      tokens: [] as Array<AdminTokenDto>,
      isLoading: false,
    };
  },
  computed: {
    usableCount(): number {
      return this.tokens.filter((t) => t.usable).length;
    },
  },
  methods: {
    ago: formatRelativeDate,
    fullDate: formatDateTime,
    until(value: string): string {
      const diff = new Date(value).getTime() - Date.now();
      const days = Math.floor(diff / 86400000);
      if (days >= 1) return `${days}일 남음`;
      const hours = Math.floor(diff / 3600000);
      return hours >= 1 ? `${hours}시간 남음` : '곧 만료';
    },
    async load() {
      this.isLoading = true;
      await getTokens()
      .then((tokens) => {
        this.tokens = tokens;
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async revoke(token: AdminTokenDto) {
      const ok = await confirmDialog({
        title: '토큰을 폐기할까요?',
        message: `'${token.name}' (${token.owner?.name ?? token.ownerEmail}) 토큰을 쓰는 에이전트·스크립트는 즉시 멈춥니다.`,
        confirmLabel: '폐기',
        danger: true,
      });
      if (!ok) {
        return;
      }
      this.isLoading = true;
      await revokeToken(token.id)
      .then(() => {
        toast.success('토큰을 폐기했습니다.');
        this.load();
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
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
.tokens {
  display: grid;
  gap: var(--s-4);
}

.summary {
  display: flex;
  gap: var(--s-2);
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
  vertical-align: top;
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

.table tr.muted td {
  opacity: 0.55;
}

.table .right {
  text-align: right;
}

.token-name {
  font-weight: 700;
}

.owner {
  color: var(--text);
  font-weight: 600;
}

.scope + .scope {
  margin-left: 4px;
}

.empty {
  text-align: center;
  color: var(--text-3);
  padding: var(--s-10) !important;
}
</style>
