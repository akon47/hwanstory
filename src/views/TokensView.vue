<template>
  <div class="tokens-container">
    <div class="page-head">
      <div>
        <h1>액세스 토큰</h1>
        <p class="lead">AI 에이전트·스크립트가 내 블로그 API 를 쓸 때 사용하는 개인 토큰입니다. 토큰은 내 권한 안에서, 고른 범위(권한)만 할 수 있습니다.</p>
      </div>
      <div class="page-actions">
        <router-link to="/device">
          <button class="secondary">기기 로그인 승인</button>
        </router-link>
        <button @click="showCreateForm = !showCreateForm">{{ showCreateForm ? '닫기' : '새 토큰' }}</button>
      </div>
    </div>

    <!-- 방금 발급된 토큰 (한 번만 표시) -->
    <div v-if="issued" class="card issued">
      <div class="card-title">🔑 토큰이 발급되었습니다 — 지금 저장하세요. 다시 볼 수 없습니다.</div>
      <div class="token-row">
        <input class="mono" type="text" readonly :value="issued.token" @focus="selectAll"/>
        <button class="secondary" @click="copy(issued.token, '토큰')">복사</button>
      </div>
      <p class="hint">
        에이전트 컴퓨터의 <b>터미널에서</b> 아래 명령을 실행하면 토큰이 파일로만 저장됩니다(채팅에 붙이지 마세요).
        에이전트는 이 파일을 <code>curl -H @~/.config/hwanstory/auth-header</code> 로 씁니다.
      </p>
      <div class="snippet-head">bash / macOS / Linux / Git Bash</div>
      <pre class="snippet"><code>{{ saveCommandBash }}</code></pre>
      <div class="snippet-head">PowerShell (Windows)</div>
      <pre class="snippet"><code>{{ saveCommandPowerShell }}</code></pre>
      <div class="row-end">
        <button class="secondary" @click="issued = null">확인했습니다</button>
      </div>
    </div>

    <!-- 새 토큰 만들기 -->
    <div v-if="showCreateForm" class="card">
      <div class="card-title">새 액세스 토큰</div>
      <p class="hint">만든 직후 한 번만 보입니다. 필요한 권한만, 짧게 주세요. 에이전트가 스스로 받아 가게 하려면 이 대신 <b>기기 로그인</b>을 쓰는 것이 더 안전합니다.</p>
      <label for="token-name">이름</label>
      <input id="token-name" type="text" v-model="newName" maxlength="100" placeholder="예: Claude Code - 블로그 글쓰기"/>
      <div class="label">권한</div>
      <label class="check" v-for="scope in allScopes" :key="scope">
        <input type="checkbox" :value="scope" v-model="newScopes"/>
        <span><b>{{ scope }}</b> <span class="muted">— {{ scopeDescriptions[scope] }}</span></span>
      </label>
      <div class="tiny muted">읽기(내 글·비공개 글·통계 조회)는 권한과 무관하게 가능합니다. 계정 정보 변경·탈퇴·토큰 발급은 토큰으로 할 수 없습니다.</div>
      <label for="token-ttl">만료</label>
      <select id="token-ttl" v-model.number="newTtlDays">
        <option v-for="choice in ttlChoices" :key="choice.value" :value="choice.value">{{ choice.label }}</option>
      </select>
      <div class="row-end">
        <button :disabled="!canCreate || isLoading" @click="create">만들기</button>
      </div>
    </div>

    <!-- AI 에이전트에게 맡기기 -->
    <div class="card">
      <div class="card-title">🤖 AI 에이전트에게 맡기기</div>
      <ol class="steps">
        <li>코딩 에이전트(Claude Code, Codex 등)에게 아래 프롬프트를 줍니다. 에이전트가 <a :href="agentsGuideUrl" target="_blank" rel="noopener">agents.md</a> 를 읽고 <b>기기 로그인</b>을 시작해 <b>8자리 코드</b>를 알려 줍니다.</li>
        <li><router-link to="/device">기기 로그인 승인</router-link>에서 코드·요청 IP·권한을 확인하고 승인합니다.</li>
        <li>토큰은 에이전트 컴퓨터의 <code>~/.config/hwanstory/</code> 에만 저장됩니다. 대화에 비밀이 오가지 않습니다. 끝나면 에이전트가 스스로 토큰을 폐기합니다.</li>
      </ol>
      <div class="snippet-head">프롬프트 예시</div>
      <pre class="snippet"><code>{{ agentPrompt }}</code></pre>
      <div class="row-end">
        <router-link to="/agents">
          <button class="secondary">가이드 보기</button>
        </router-link>
        <button class="secondary" @click="copy(agentPrompt, '프롬프트')">프롬프트 복사</button>
      </div>
    </div>

    <!-- 토큰 목록 -->
    <div class="card flush">
      <div class="card-title padded">내 토큰 <span class="muted small">폐기하면 바로 401 — 쓰던 에이전트·스크립트가 즉시 멈춥니다.</span></div>
      <div class="table-wrapper">
        <table class="token-table">
          <thead>
          <tr>
            <th>이름</th>
            <th>권한</th>
            <th>마지막 사용</th>
            <th>만료</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="token in tokens" :key="token.id" :class="{ disabled: !token.usable }">
            <td>
              <div class="name">{{ token.name }}</div>
              <div class="tiny muted mono">hsp_{{ token.tokenId }}_… · {{ token.origin === 'DEVICE' ? '기기 로그인' : '웹' }} · {{ formatDate(token.createdAt) }}</div>
            </td>
            <td>
              <span v-for="scope in token.scopes" :key="scope" class="badge">{{ scope }}</span>
            </td>
            <td class="small">
              <template v-if="token.lastUsedAt">
                <div>{{ formatAgo(token.lastUsedAt) }}</div>
                <div class="tiny muted mono">{{ token.lastUsedIp }}</div>
              </template>
              <span v-else class="muted">사용 안 함</span>
            </td>
            <td class="small">
              <span v-if="token.revokedAt" class="status revoked">폐기됨</span>
              <span v-else-if="token.expired" class="status expired">만료됨</span>
              <span v-else-if="token.expiresAt" :title="formatDateTime(token.expiresAt)">{{ formatUntil(token.expiresAt) }}</span>
              <span v-else>무기한</span>
            </td>
            <td class="actions">
              <button v-if="token.usable" class="red-button action" :disabled="isLoading" @click="revoke(token)">폐기</button>
            </td>
          </tr>
          <tr v-if="!isLoading && tokens.length === 0">
            <td colspan="5" class="empty">토큰이 없습니다. 에이전트는 기기 로그인으로 스스로 받아 갑니다.</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { HttpApiError, serverUrl } from '@/api/common/httpApiClient';
import { createAccessToken, getAccessTokens, revokeAccessToken } from '@/api/tokens';
import {
  ACCESS_TOKEN_SCOPE_DESCRIPTIONS,
  AccessTokenDto,
  AccessTokenScope,
  IssuedAccessTokenDto,
} from '@/api/models/token.dtos';

// 토큰 만료 선택지 (0 = 무기한)
const TTL_CHOICES = [
  { value: 1, label: '1일' },
  { value: 7, label: '7일' },
  { value: 30, label: '30일 (기본)' },
  { value: 90, label: '90일' },
  { value: 365, label: '1년' },
  { value: 0, label: '무기한 (직접 폐기할 때까지)' },
];

export default defineComponent({
  name: 'TokensView',
  data() {
    return {
      tokens: [] as Array<AccessTokenDto>,
      issued: null as IssuedAccessTokenDto | null,
      showCreateForm: false,
      newName: '',
      newScopes: ['posts'] as Array<AccessTokenScope>,
      newTtlDays: 30,
      ttlChoices: TTL_CHOICES,
      allScopes: ['posts', 'social'] as Array<AccessTokenScope>,
      scopeDescriptions: ACCESS_TOKEN_SCOPE_DESCRIPTIONS,
      isLoading: false,
    };
  },
  computed: {
    apiBaseUrl(): string {
      return (serverUrl as string).replace(/\/+$/, '');
    },
    agentsGuideUrl(): string {
      return `${this.apiBaseUrl}/agents.md`;
    },
    agentPrompt(): string {
      return `${this.agentsGuideUrl} 를 읽고 그 가이드대로 내 Hwan'Story 블로그 작업을 맡아 줘.\n`
          + `먼저 기기 로그인으로 토큰을 받고(승인 주소와 8자리 코드를 알려 줘), 권한은 posts 만 요청해.\n`
          + `할 일: (예: "내 글들의 요약·태그를 점검해서 표로 보여 주고, 내가 고르면 반영해 줘" / "아래 내용으로 새 글을 임시저장으로 올려 줘")`;
    },
    canCreate(): boolean {
      return this.newName.trim().length > 0 && this.newScopes.length > 0;
    },
    saveCommandBash(): string {
      const token = this.issued?.token ?? '';
      return `mkdir -p ~/.config/hwanstory && (umask 077; printf 'Authorization: Bearer %s\\n' '${token}' > ~/.config/hwanstory/auth-header)`;
    },
    saveCommandPowerShell(): string {
      const token = this.issued?.token ?? '';
      return `New-Item -ItemType Directory -Force "$HOME\\.config\\hwanstory" | Out-Null; [IO.File]::WriteAllText("$HOME\\.config\\hwanstory\\auth-header", "Authorization: Bearer ${token}\`n")`;
    },
  },
  methods: {
    formatDate(value: string): string {
      const date = new Date(value);
      return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
    },
    formatDateTime(value: string): string {
      const date = new Date(value);
      const hours = `${date.getHours()}`.padStart(2, '0');
      const minutes = `${date.getMinutes()}`.padStart(2, '0');
      return `${this.formatDate(value)} ${hours}:${minutes}`;
    },
    formatAgo(value: string): string {
      const diff = Date.now() - new Date(value).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return '방금';
      if (minutes < 60) return `${minutes}분 전`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}시간 전`;
      const days = Math.floor(hours / 24);
      return days < 30 ? `${days}일 전` : this.formatDate(value);
    },
    formatUntil(value: string): string {
      const diff = new Date(value).getTime() - Date.now();
      const days = Math.floor(diff / 86400000);
      if (days >= 1) return `${days}일 남음`;
      const hours = Math.floor(diff / 3600000);
      return hours >= 1 ? `${hours}시간 남음` : '곧 만료';
    },
    selectAll(event: FocusEvent) {
      (event.target as HTMLInputElement).select();
    },
    async copy(text: string, what: string) {
      try {
        await navigator.clipboard.writeText(text);
        alert(`${what}을(를) 복사했습니다.`);
      } catch (e) {
        alert('클립보드에 복사할 수 없습니다. 직접 선택해서 복사하세요.');
      }
    },
    async load() {
      this.isLoading = true;
      await getAccessTokens()
      .then((tokens) => {
        this.tokens = tokens;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async create() {
      if (!this.canCreate) {
        return;
      }
      this.isLoading = true;
      await createAccessToken({
        name: this.newName.trim(),
        scopes: this.newScopes,
        ttlDays: this.newTtlDays,
      })
      .then((issued) => {
        this.issued = issued;
        this.showCreateForm = false;
        this.newName = '';
        this.newScopes = ['posts'];
        this.newTtlDays = 30;
        this.load();
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        this.isLoading = false;
      });
    },
    async revoke(token: AccessTokenDto) {
      if (!confirm(`토큰 '${token.name}' 을(를) 폐기합니다. 이 토큰을 쓰는 에이전트·스크립트는 즉시 멈춥니다. 계속할까요?`)) {
        return;
      }
      this.isLoading = true;
      await revokeAccessToken(token.id)
      .then(() => this.load())
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        this.isLoading = false;
      });
    },
  },
  created() {
    this.load();
  },
});
</script>

<style scoped>

.tokens-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--base-gap);
  box-sizing: border-box;
  display: grid;
  grid-row-gap: var(--base-gap);
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--base-gap);
  flex-wrap: wrap;
}

.page-head h1 {
  font-size: 1.8em;
  margin-bottom: 0.25em;
}

.lead {
  font-weight: 300;
  color: #8e9297;
  max-width: 640px;
  line-height: 1.5;
}

.page-actions {
  display: flex;
  gap: var(--half-base-gab);
  flex-shrink: 0;
}

.card {
  background-color: var(--content-item-background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);
  padding: var(--base-gap);
  box-sizing: border-box;
  display: grid;
  grid-row-gap: var(--half-base-gab);
}

.card.flush {
  padding: 0;
  grid-row-gap: 0;
}

.card.issued {
  border-color: #21b314;
}

.card-title {
  font-weight: bold;
  font-size: 1.1em;
}

.card-title.padded {
  padding: var(--base-gap) var(--base-gap) var(--half-base-gab);
}

.token-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--half-base-gab);
}

.token-row input {
  font-size: 13px;
  padding: 10px 12px;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--border-color);
  background-color: var(--background-color);
  color: var(--base-color);
}

.card input[type="text"],
.card select {
  font-size: 14px;
  padding: 10px 12px;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--border-color);
  background-color: var(--background-color);
  color: var(--base-color);
  font-family: var(--base-font-family);
  outline: none;
}

.card label,
.card .label {
  font-size: 0.9em;
  font-weight: 500;
  margin-bottom: -0.35em;
}

.card label.check {
  display: flex;
  gap: 0.5em;
  align-items: flex-start;
  font-weight: 400;
  margin: 0;
  cursor: pointer;
}

.card label.check input {
  margin-top: 0.3em;
}

.steps {
  list-style: decimal;
  margin-left: 1.5em;
  line-height: 1.7;
}

.snippet-head {
  font-size: 0.8em;
  color: #8e9297;
  margin-bottom: -0.5em;
}

.snippet {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);
  padding: 0.75em 1em;
  font-size: 0.85em;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background-color: var(--background-color);
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.9em;
}

.row-end {
  display: flex;
  justify-content: flex-end;
  gap: var(--half-base-gab);
}

.hint {
  font-size: 0.85em;
  color: #8e9297;
  line-height: 1.5;
  margin: 0;
}

.muted {
  color: #8e9297;
  font-weight: 300;
}

.small {
  font-size: 0.85em;
}

.tiny {
  font-size: 0.75em;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

button.secondary {
  background-color: transparent;
  color: var(--base-color);
  border: 1px solid var(--border-color);
}

@media (hover: hover) and (pointer: fine) {
  button.secondary:hover:not([disabled]) {
    background-color: var(--hover-color);
  }
}

.table-wrapper {
  overflow-x: auto;
}

.token-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.token-table th,
.token-table td {
  padding: 0.75em var(--base-gap);
  border-top: 1px solid var(--border-color);
  text-align: left;
  vertical-align: top;
}

.token-table th {
  font-size: 0.8em;
  font-weight: 500;
  color: #8e9297;
  white-space: nowrap;
}

.token-table tr.disabled td {
  opacity: 0.55;
}

.token-table .name {
  font-weight: 600;
}

.token-table .badge {
  margin-right: 0.3em;
}

.token-table .actions {
  text-align: right;
  white-space: nowrap;
}

.token-table .action {
  height: 26px;
  font-size: 12px;
}

.token-table .empty {
  text-align: center;
  color: #8e9297;
  padding: 2em;
}

.status {
  border-radius: 4px;
  padding: 0.15em 0.5em;
  font-size: 0.85em;
  font-weight: bold;
}

.status.revoked {
  background-color: rgba(218, 55, 60, 0.15);
  color: var(--button-red-color);
}

.status.expired {
  background-color: var(--hover-color);
}

</style>
