<template>
  <div class="system">
    <div class="page-head">
      <div>
        <h1>시스템</h1>
        <p class="lead">API 서버가 건강한지, 디스크와 메모리가 넉넉한지, 처리 대기 중인 일이 있는지 봅니다.</p>
      </div>
      <button class="btn btn-secondary btn-sm" type="button" :disabled="isLoading" @click="load">새로고침</button>
    </div>

    <template v-if="system">
      <div class="status-row">
        <div class="status" :class="system.databaseOk ? 'ok' : 'bad'">
          <app-icon :name="system.databaseOk ? 'check-circle' : 'alert'" :size="18"/>데이터베이스 {{ system.databaseOk ? '정상' : '오류' }}
        </div>
        <div class="status" :class="system.redisOk ? 'ok' : 'bad'">
          <app-icon :name="system.redisOk ? 'check-circle' : 'alert'" :size="18"/>Redis {{ system.redisOk ? '정상' : '오류' }}
        </div>
        <div class="status ok">
          <app-icon name="radio" :size="18"/>웹소켓 세션 {{ system.websocketSessions }}
        </div>
      </div>

      <div class="grid">
        <section class="card">
          <div class="card-head"><h2>서버</h2></div>
          <dl class="kv">
            <dt>버전</dt><dd class="mono">{{ system.appVersion ?? '알 수 없음' }}</dd>
            <dt>빌드</dt><dd class="mono">{{ system.buildTime ? fullDate(system.buildTime) : '알 수 없음' }}</dd>
            <dt>프로필</dt><dd class="mono">{{ system.profile }}</dd>
            <dt>Java</dt><dd class="mono">{{ system.javaVersion }}</dd>
            <dt>시작</dt><dd>{{ fullDate(system.startedAt) }} <span class="subtle">({{ uptime(system.uptimeMillis) }} 가동)</span></dd>
            <dt>CPU</dt><dd>{{ system.processors }} 코어</dd>
          </dl>
        </section>

        <section class="card">
          <div class="card-head"><h2>메모리</h2><span class="subtle small">JVM 힙</span></div>
          <div class="card-body">
            <div class="meter">
              <div class="meter-bar" :style="{ width: percent(system.heapUsedBytes, system.heapMaxBytes) + '%' }" :class="{ warn: percent(system.heapUsedBytes, system.heapMaxBytes) > 85 }"/>
            </div>
            <div class="meter-label">
              <span>{{ bytes(system.heapUsedBytes) }} 사용</span>
              <span class="subtle">최대 {{ bytes(system.heapMaxBytes) }}</span>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>첨부파일</h2><span class="subtle small mono">{{ system.attachmentPath }}</span></div>
          <div class="card-body">
            <div class="meter">
              <div class="meter-bar" :style="{ width: percent(system.attachmentTotalBytes - system.attachmentFreeBytes, system.attachmentTotalBytes) + '%' }"
                   :class="{ warn: percent(system.attachmentTotalBytes - system.attachmentFreeBytes, system.attachmentTotalBytes) > 85 }"/>
            </div>
            <div class="meter-label">
              <span>디스크 {{ bytes(system.attachmentTotalBytes - system.attachmentFreeBytes) }} 사용</span>
              <span class="subtle">남음 {{ bytes(system.attachmentFreeBytes) }} / {{ bytes(system.attachmentTotalBytes) }}</span>
            </div>
            <dl class="kv compact">
              <dt>파일 수</dt><dd class="num">{{ n(system.attachmentCount) }}</dd>
              <dt>파일 용량</dt><dd>{{ bytes(system.attachmentBytes) }}</dd>
            </dl>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>대기 중인 일</h2></div>
          <dl class="kv">
            <dt>예약 발행 글</dt><dd class="num">{{ system.scheduledPostCount }}개 <span class="subtle">(매분 확인)</span></dd>
            <dt>기기 로그인 승인 대기</dt><dd class="num">{{ system.pendingDeviceCount }}건</dd>
            <dt>살아있는 액세스 토큰</dt><dd class="num">{{ system.activeTokenCount }}개 <router-link class="small" to="/admin/tokens">보기</router-link></dd>
          </dl>
        </section>
      </div>
    </template>
    <div v-else-if="isLoading" class="loading"><loading-spinner/></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AdminSystemDto } from '@/api/models/admin.dtos';
import { getSystem } from '@/api/admin';
import { HttpApiError } from '@/api/common/httpApiClient';
import AppIcon from '@/components/common/AppIcon.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { toast } from '@/utils/dialog';
import { formatCount, formatDateTime } from '@/utils/format';

export default defineComponent({
  name: 'AdminSystemView',
  components: { AppIcon, LoadingSpinner },
  data() {
    return {
      system: null as AdminSystemDto | null,
      isLoading: false,
    };
  },
  methods: {
    n: formatCount,
    fullDate: formatDateTime,
    bytes(value: number): string {
      if (!value || value < 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let i = 0;
      let v = value;
      while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
      }
      return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
    },
    percent(used: number, total: number): number {
      return total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    },
    uptime(ms: number): string {
      const minutes = Math.floor(ms / 60000);
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      const mins = minutes % 60;
      return days > 0 ? `${days}일 ${hours}시간` : hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
    },
    async load() {
      this.isLoading = true;
      await getSystem()
      .then((system) => {
        this.system = system;
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
.system {
  display: grid;
  gap: var(--s-5);
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: var(--text-sm);
}

.status.ok {
  background: var(--success-soft);
  color: var(--success);
}

.status.bad {
  background: var(--danger-soft);
  color: var(--danger);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--s-4);
}

.kv {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px var(--s-4);
  padding: var(--s-4) var(--s-6);
  font-size: var(--text-sm);
}

.kv.compact {
  padding: var(--s-3) 0 0;
}

.kv dt {
  color: var(--text-3);
  font-weight: 600;
}

.kv dd {
  min-width: 0;
  overflow-wrap: anywhere;
}

.meter {
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  overflow: hidden;
}

.meter-bar {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-pill);
  transition: width 0.3s ease;
}

.meter-bar.warn {
  background: var(--danger);
}

.meter-label {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: var(--text-sm);
}

.loading {
  display: flex;
  justify-content: center;
  padding: var(--s-10);
}
</style>
