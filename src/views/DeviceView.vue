<template>
  <div class="device-container">
    <div class="form-container">
      <!-- 승인 완료 -->
      <div v-if="approvedClientName" class="form-wrapper">
        <div class="headline">
          <div class="icon">✅</div>
          <h2>승인했습니다</h2>
          <p class="muted"><b>{{ approvedClientName }}</b> 가 몇 초 안에 토큰을 받아 갑니다. 이 창은 닫아도 됩니다.</p>
        </div>
        <router-link to="/tokens">
          <button class="full">액세스 토큰 보기</button>
        </router-link>
      </div>

      <!-- 거부 완료 -->
      <div v-else-if="deniedClientName" class="form-wrapper">
        <div class="headline">
          <div class="icon">🚫</div>
          <h2>거부했습니다</h2>
          <p class="muted"><b>{{ deniedClientName }}</b> 의 요청을 거부했습니다. 에이전트는 토큰을 받지 못합니다.</p>
        </div>
        <router-link to="/">
          <button class="full">홈으로</button>
        </router-link>
      </div>

      <!-- 요청 확인 -->
      <div v-else-if="request" class="form-wrapper">
        <div class="headline">
          <div class="icon">🖥️</div>
          <h2>기기 로그인 요청</h2>
          <p class="muted">에이전트가 내 계정으로 API 토큰을 요청했습니다.</p>
        </div>
        <div class="user-code">{{ request.userCode }}</div>
        <p class="hint center">에이전트(또는 터미널)에 표시된 코드와 같은지 확인하세요.</p>
        <table class="kv">
          <tbody>
          <tr>
            <th>요청한 클라이언트</th>
            <td><b>{{ request.clientName }}</b></td>
          </tr>
          <tr>
            <th>요청 IP</th>
            <td class="mono">{{ request.requestedIp || '-' }}</td>
          </tr>
          <tr v-if="request.requestedUa">
            <th>User-Agent</th>
            <td class="small muted">{{ truncate(request.requestedUa, 90) }}</td>
          </tr>
          <tr>
            <th>권한</th>
            <td>
              <div class="scopes">
                <span v-for="scope in request.scopes" :key="scope" class="badge">{{ scope }}</span>
              </div>
              <div class="tiny muted" v-for="scope in request.scopes" :key="`d-${scope}`">
                <b>{{ scope }}</b> — {{ scopeDescriptions[scope] }}
              </div>
              <div class="tiny muted">읽기(내 글·비공개 글·통계 조회)는 권한과 무관하게 가능합니다.</div>
            </td>
          </tr>
          <tr>
            <th>코드 만료</th>
            <td class="small">{{ remaining }}</td>
          </tr>
          </tbody>
        </table>
        <div class="warning">
          ⚠️ 직접 시킨 작업이 맞을 때만 승인하세요. 누군가 보내 준 코드라면 거부하세요 — 승인하면 그 사람이 내 권한으로 글을 쓰고 고칠 수 있습니다.
        </div>
        <label for="ttl">토큰 만료</label>
        <select id="ttl" v-model.number="ttlDays">
          <option v-for="choice in ttlChoices" :key="choice.value" :value="choice.value">{{ choice.label }}</option>
        </select>
        <p class="hint">작업이 끝나면 <router-link to="/tokens">액세스 토큰</router-link> 화면에서 언제든 폐기할 수 있습니다.</p>
        <div class="actions">
          <button class="red-button" :disabled="isLoading" @click="deny">거부</button>
          <button :disabled="isLoading" @click="approve">승인</button>
        </div>
      </div>

      <!-- 코드 입력 -->
      <div v-else class="form-wrapper">
        <div class="headline">
          <div class="icon">🖥️</div>
          <h2>기기 로그인</h2>
          <p class="muted">AI 에이전트나 터미널에 표시된 8자리 코드를 입력하세요.</p>
        </div>
        <input class="code-input" type="text" v-model="code" placeholder="XXXX-XXXX" maxlength="9"
               autocomplete="off" spellcheck="false" @keyup.enter="lookup"/>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <button class="full" :disabled="!isCodeValid || isLoading" @click="lookup">계속</button>
        <p class="hint center">코드는 10분 동안 유효합니다. 에이전트가 쓰는 방법은
          <router-link to="/agents">가이드</router-link>에 있습니다.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { HttpApiError } from '@/api/common/httpApiClient';
import { approveDeviceAuthorization, denyDeviceAuthorization, getDeviceAuthorization } from '@/api/tokens';
import { ACCESS_TOKEN_SCOPE_DESCRIPTIONS, DeviceAuthorizationDto } from '@/api/models/token.dtos';

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
  name: 'DeviceView',
  data() {
    return {
      code: ((this.$route.query.code as string) ?? '').toUpperCase(),
      request: null as DeviceAuthorizationDto | null,
      ttlDays: 30,
      ttlChoices: TTL_CHOICES,
      scopeDescriptions: ACCESS_TOKEN_SCOPE_DESCRIPTIONS,
      approvedClientName: '',
      deniedClientName: '',
      errorMessage: '',
      isLoading: false,
      now: Date.now(),
      timer: 0 as number | ReturnType<typeof setInterval>,
    };
  },
  computed: {
    // 글자만 8자인지 (하이픈·공백·대소문자는 서버가 정규화한다)
    isCodeValid(): boolean {
      return this.code.replace(/[^A-Za-z]/g, '').length === 8;
    },
    remaining(): string {
      if (!this.request) {
        return '';
      }
      const diff = new Date(this.request.expiresAt).getTime() - this.now;
      if (diff <= 0) {
        return '만료됨';
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      return minutes > 0 ? `${minutes}분 ${seconds}초 남음` : `${seconds}초 남음`;
    },
  },
  methods: {
    truncate(value: string, max: number): string {
      return value.length > max ? `${value.substring(0, max)}…` : value;
    },
    async lookup() {
      if (!this.isCodeValid) {
        return;
      }
      this.isLoading = true;
      this.errorMessage = '';
      await getDeviceAuthorization(this.code)
      .then((request) => {
        this.request = request;
        this.code = request.userCode;
        if (this.$route.query.code !== request.userCode) {
          this.$router.replace({ path: '/device', query: { code: request.userCode } });
        }
      })
      .catch((error: HttpApiError) => {
        this.request = null;
        this.errorMessage = error.isNotFound()
            ? '코드가 없거나 만료되었습니다. 에이전트에게 다시 시작하도록 요청하세요.'
            : error.getErrorMessage();
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async approve() {
      if (!this.request) {
        return;
      }
      this.isLoading = true;
      await approveDeviceAuthorization(this.request.userCode, this.ttlDays)
      .then((request) => {
        this.approvedClientName = request.clientName;
        this.request = null;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        if (error.isNotFound()) {
          this.request = null;
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async deny() {
      if (!this.request) {
        return;
      }
      this.isLoading = true;
      await denyDeviceAuthorization(this.request.userCode)
      .then((request) => {
        this.deniedClientName = request.clientName;
        this.request = null;
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        if (error.isNotFound()) {
          this.request = null;
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
  },
  created() {
    if (this.isCodeValid) {
      this.lookup();
    }
    this.timer = setInterval(() => {
      this.now = Date.now();
    }, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
});
</script>

<style scoped>

.device-container {
  display: grid;
  width: 100%;
  height: 100%;
}

.form-wrapper {
  width: 460px;
}

@media (max-width: 500px) {
  .form-wrapper {
    width: 100%;
  }
}

.headline {
  text-align: center;
  margin-bottom: var(--half-base-gab);
}

.headline .icon {
  font-size: 2.2em;
}

.headline h2 {
  font-size: 1.4em;
  margin: 0.2em 0;
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
  margin-top: 0.25em;
}

.center {
  text-align: center;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.user-code {
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 2.2em;
  font-weight: bold;
  letter-spacing: 0.15em;
  padding: 0.4em;
  border: 1px dashed var(--border-color);
  border-radius: var(--base-border-radius);
  background-color: var(--background-color);
}

.hint {
  font-size: 0.8em;
  color: #8e9297;
  margin: 0;
}

.kv {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.kv th,
.kv td {
  text-align: left;
  vertical-align: top;
  padding: 0.5em 0.25em;
  border-bottom: 1px solid var(--border-color);
}

.kv th {
  width: 35%;
  font-weight: 500;
  color: #8e9297;
}

.scopes {
  display: flex;
  gap: 0.4em;
  flex-wrap: wrap;
}

.warning {
  font-size: 0.85em;
  line-height: 1.5;
  padding: 0.75em;
  border-radius: var(--base-border-radius);
  border: 1px solid #e5a50a;
  background-color: rgba(229, 165, 10, 0.1);
}

label {
  font-size: 0.9em;
  margin-bottom: -0.25em;
}

select {
  font-size: 14px;
  padding: 10px 12px;
  border-radius: var(--base-border-radius);
  border: 1px solid var(--border-color);
  background-color: var(--content-item-background-color);
  color: var(--base-color);
  font-family: var(--base-font-family);
}

.actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--half-base-gab);
}

.code-input {
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1.6em !important;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.error {
  font-size: 0.85em;
  color: var(--button-red-color);
}

button.full {
  width: 100%;
}

</style>
