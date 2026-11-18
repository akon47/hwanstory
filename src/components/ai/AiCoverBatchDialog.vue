<template>
  <teleport to="body">
    <div class="cb-backdrop" @click.self="requestClose">
      <div class="cb-dialog" role="dialog" aria-modal="true" aria-labelledby="cb-title">
        <header class="cb-head">
          <div class="cb-head-text">
            <h2 id="cb-title">커버 한꺼번에 만들기</h2>
            <p class="small muted">{{ headline }}</p>
          </div>
          <button class="btn btn-icon btn-sm" type="button" aria-label="닫기" title="닫기" @click="requestClose">
            <app-icon name="x" :size="18"/>
          </button>
        </header>

        <!-- 만들기 시작 뒤: 진행 상황 -->
        <div v-if="phase !== 'select'" class="cb-progress" aria-live="polite">
          <div class="cb-progress-row">
            <span v-if="phase === 'running'" class="spinner" aria-hidden="true"/>
            <app-icon v-else-if="phase === 'done'" class="ok" name="check-circle" :size="16"/>
            <app-icon v-else class="warn" name="info" :size="16"/>
            <span class="cb-status">{{ statusText }}</span>
          </div>
          <div class="cb-bar" aria-hidden="true"><span :style="{ width: `${progressPercent}%` }"/></div>
          <div class="cb-counts small subtle num">
            {{ formatCount(processedCount) }} / {{ formatCount(runRows.length) }}
            <span class="dot"/>만듦 {{ counts.created }}
            <template v-if="counts.skipped"><span class="dot"/>건너뜀 {{ counts.skipped }}</template>
            <template v-if="counts.failed"><span class="dot"/>실패 {{ counts.failed }}</template>
          </div>
        </div>

        <div ref="body" class="cb-body">
          <!-- 고르기 -->
          <template v-if="phase === 'select'">
            <label class="cb-all">
              <input type="checkbox" :checked="allChecked" :indeterminate.prop="someChecked" @change="toggleAll"/>
              <span>전체 선택</span>
              <span class="subtle num">{{ formatCount(checkedCount) }} / {{ formatCount(posts.length) }}</span>
            </label>
            <ul class="cb-list">
              <li v-for="post in posts" :key="post.postUrl">
                <label class="cb-row selectable">
                  <input type="checkbox" v-model="checked[post.postUrl]"/>
                  <span class="cb-row-main">
                    <span class="cb-title">{{ post.title || '(제목 없음)' }}</span>
                    <span class="cb-meta">
                      <span class="num">{{ formatRelativeDate(post.createdAt) }}</span>
                      <span class="badge" :class="openTypeBadge(post.openType).className">{{ openTypeBadge(post.openType).label }}</span>
                    </span>
                  </span>
                </label>
              </li>
            </ul>
            <p v-if="total > posts.length" class="small subtle cb-more">
              커버 없는 글이 {{ formatCount(total) }}개라 최근 {{ formatCount(posts.length) }}개만 보여요. 다 만들면 나머지가 이어서 보여요.
            </p>
          </template>

          <!-- 진행·결과 -->
          <ul v-else class="cb-list">
            <li v-for="row in runRows" :key="row.postUrl" class="cb-row" :class="row.state">
              <span class="cb-state" :aria-label="stateLabel(row.state)">
                <span v-if="row.state === 'working'" class="spinner" aria-hidden="true"/>
                <app-icon v-else :name="stateIcon(row.state)" :size="16"/>
              </span>
              <span class="cb-row-main">
                <span class="cb-title">{{ row.title || '(제목 없음)' }}</span>
                <span class="cb-meta">
                  <span class="cb-state-label">{{ stateLabel(row.state) }}</span>
                  <span v-if="row.message" class="cb-message">{{ row.message }}</span>
                </span>
              </span>
              <img v-if="row.url" class="cb-thumb" :src="imageUrl(row.url)" :alt="`${row.title} 커버`" loading="lazy"/>
            </li>
          </ul>
        </div>

        <div v-if="phase === 'select'" class="cb-options">
          <label class="check">
            <input type="checkbox" v-model="useAsThumbnail"/>
            <span>썸네일로 쓰기<span class="check-hint">글 목록과 공유 미리보기에 보이는 대표 이미지예요</span></span>
          </label>
          <label class="check">
            <input type="checkbox" v-model="insertIntoContent"/>
            <span>본문 맨 위에도 넣기<span class="check-hint">켜면 글 본문이 실제로 수정돼요(맨 위에 이미지 한 줄, 수정일도 바뀌어요)</span></span>
          </label>
          <p class="cb-cost">
            <span>예상 비용</span>
            <span class="cost-value num">약 {{ costRangeText }}</span>
            <span class="subtle">글 하나에 약 {{ formatUsd(costRange[0]) }}~{{ formatUsd(costRange[1]).replace('$', '') }}</span>
          </p>
          <p v-if="checkedCount > batchMax" class="small subtle">한 번에 {{ batchMax }}개씩 나눠서 차례로 만들어요.</p>
          <p v-if="!useAsThumbnail && !insertIntoContent" class="small error-line">썸네일이나 본문 중 하나는 골라 주세요.</p>
        </div>

        <div v-if="error" class="cb-error">
          <ai-error-box :message="error" :code="errorCode" :settings-link="false"/>
        </div>

        <footer class="cb-foot">
          <template v-if="phase === 'select'">
            <button class="btn btn-secondary" type="button" @click="requestClose">취소</button>
            <button class="btn" type="button" :disabled="!canStart" @click="start">
              <app-icon name="sparkles" :size="16"/>{{ formatCount(checkedCount) }}개 만들기
            </button>
          </template>
          <template v-else-if="phase === 'running'">
            <span class="small muted foot-note">멈춰도 이미 만든 커버는 그대로 남아요.</span>
            <button class="btn btn-secondary" type="button" :disabled="isStopping" @click="stop">
              {{ isStopping ? '멈추는 중…' : '멈추기' }}
            </button>
          </template>
          <template v-else>
            <button class="btn" type="button" @click="$emit('close')">닫기</button>
          </template>
        </footer>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, markRaw, PropType } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import AiErrorBox from '@/components/ai/AiErrorBox.vue';
import { streamAiCoverBatch } from '@/api/ai';
import {
  AI_COVER_BATCH_MAX,
  AI_COVER_COST_RANGE,
  AiCoverBatchDoneEventDto,
  AiCoverBatchItemEventDto,
  AiMissingCoverPostDto,
} from '@/api/models/ai.dtos';
import { OpenType } from '@/api/models/blog.dtos';
import { attachmentFileBaseUrl, HttpApiError } from '@/api/common/httpApiClient';
import { errorCodeOf, SseStream } from '@/api/common/sseClient';
import { confirmDialog, dialogState, toast } from '@/utils/dialog';
import { formatCount, formatRelativeDate, formatUsd } from '@/utils/format';

type RowState = 'queued' | 'working' | 'created' | 'skipped' | 'failed' | 'cancelled' | 'interrupted';

interface BatchRow {
  postUrl: string;
  title: string;
  state: RowState;
  message: string;
  url: string;
}

const OPEN_TYPE_BADGES: Record<OpenType, { label: string; className: string }> = {
  PUBLIC: { label: '공개', className: '' },
  PRIVATE: { label: '비공개', className: '' },
  DRAFT: { label: '임시저장', className: 'badge-warning' },
  SCHEDULED: { label: '예약', className: 'badge-accent' },
};

const STATE_LABELS: Record<RowState, string> = {
  queued: '기다리는 중',
  working: '만드는 중',
  created: '만들었어요',
  skipped: '건너뜀',
  failed: '실패',
  cancelled: '만들지 않았어요',
  interrupted: '만들던 중에 멈췄어요',
};

const STATE_ICONS: Record<RowState, string> = {
  queued: 'clock',
  working: 'clock',
  created: 'check-circle',
  skipped: 'arrow-right',
  failed: 'alert',
  cancelled: 'x',
  interrupted: 'info',
};

// 설정 > AI 글쓰기 카드에서 여는 "커버 한꺼번에 만들기" 창.
// 고른 글을 100개씩 나눠 /covers/batch(SSE) 로 보내고, 글마다 오는 item 이벤트로 줄 상태를 바꾼다.
export default defineComponent({
  name: 'AiCoverBatchDialog',
  components: { AppIcon, AiErrorBox },
  props: {
    posts: {
      type: Array as PropType<Array<AiMissingCoverPostDto>>,
      required: true,
    },
    // 커버 없는 글 전체 수 (posts 는 최대 500개)
    total: {
      type: Number,
      required: true,
    },
  },
  // finished: 한 번이라도 만들기를 돌렸으면 (카드가 남은 수·사용량을 다시 받는다)
  emits: ['close', 'finished'],
  data() {
    const checked: Record<string, boolean> = {};
    this.posts.forEach((post) => {
      checked[post.postUrl] = true;
    });
    return {
      checked,
      useAsThumbnail: true,
      insertIntoContent: false,
      phase: 'select' as 'select' | 'running' | 'done' | 'stopped' | 'error',
      runRows: [] as Array<BatchRow>,
      status: '',
      costUsd: null as number | null,
      error: '',
      errorCode: '',
      isStopping: false,
      stream: null as SseStream | null,
      batchMax: AI_COVER_BATCH_MAX,
      costRange: AI_COVER_COST_RANGE,
    };
  },
  computed: {
    checkedCount(): number {
      return this.posts.filter((post) => this.checked[post.postUrl]).length;
    },
    allChecked(): boolean {
      return this.posts.length > 0 && this.checkedCount === this.posts.length;
    },
    someChecked(): boolean {
      return this.checkedCount > 0 && this.checkedCount < this.posts.length;
    },
    canStart(): boolean {
      return this.checkedCount > 0 && (this.useAsThumbnail || this.insertIntoContent);
    },
    costRangeText(): string {
      const [low, high] = this.costRange;
      return `${formatUsd(low * this.checkedCount)}~${formatUsd(high * this.checkedCount).replace('$', '')}`;
    },
    counts(): { created: number; skipped: number; failed: number } {
      return {
        created: this.runRows.filter((row) => row.state === 'created').length,
        skipped: this.runRows.filter((row) => row.state === 'skipped').length,
        failed: this.runRows.filter((row) => row.state === 'failed').length,
      };
    },
    processedCount(): number {
      return this.counts.created + this.counts.skipped + this.counts.failed;
    },
    progressPercent(): number {
      return this.runRows.length ? Math.round((this.processedCount / this.runRows.length) * 100) : 0;
    },
    headline(): string {
      if (this.phase === 'select') {
        return `커버 없는 글 ${formatCount(this.total)}개 중에서 고를 수 있어요.`;
      }
      return `고른 글 ${formatCount(this.runRows.length)}개`;
    },
    statusText(): string {
      if (this.phase === 'running') {
        return this.status || '준비하고 있어요';
      }
      if (this.phase === 'done') {
        return this.costUsd !== null ? `다 만들었어요. 이번에 ${formatUsd(this.costUsd)} 들었어요.` : '다 만들었어요.';
      }
      if (this.phase === 'stopped') {
        return '멈췄어요. 이미 만든 커버는 그대로 남아요. 만들던 글 하나는 마저 끝날 수 있어요.';
      }
      return '중간에 멈췄어요. 그때까지 만든 커버는 그대로 남아요.';
    },
  },
  methods: {
    formatCount,
    formatUsd,
    formatRelativeDate,
    openTypeBadge(openType: OpenType) {
      return OPEN_TYPE_BADGES[openType] ?? OPEN_TYPE_BADGES.PUBLIC;
    },
    stateLabel(state: RowState): string {
      return STATE_LABELS[state];
    },
    stateIcon(state: RowState): string {
      return STATE_ICONS[state];
    },
    imageUrl(url: string): string {
      return `${attachmentFileBaseUrl}${url}`;
    },
    toggleAll() {
      const next = !this.allChecked;
      this.posts.forEach((post) => {
        this.checked[post.postUrl] = next;
      });
    },
    // 지금 묶음에서 아직 결과가 안 온 첫 글을 "만드는 중" 으로
    markNextWorking(chunk: Array<string>) {
      const next = this.runRows.find((row) => row.state === 'queued' && chunk.includes(row.postUrl));
      if (next) {
        next.state = 'working';
      }
    },
    applyItem(item: AiCoverBatchItemEventDto, chunk: Array<string>) {
      const row = this.runRows.find((candidate) => candidate.postUrl === item.postUrl);
      if (row) {
        row.state = !item.ok ? 'failed' : item.skipped ? 'skipped' : 'created';
        row.message = item.message ?? '';
        row.url = item.ok && !item.skipped ? (item.url ?? '') : '';
      }
      // 끝난 글이 "만드는 중" 줄이 아니었으면 그 줄을 기다림으로 되돌린다 (순서가 달라도 하나만 돌게)
      this.runRows.forEach((candidate) => {
        if (candidate.state === 'working' && candidate.postUrl !== item.postUrl) {
          candidate.state = 'queued';
        }
      });
      this.markNextWorking(chunk);
      this.followWorkingRow();
    },
    // 목록이 길면 지금 만드는 글이 보이게
    followWorkingRow() {
      this.$nextTick(() => {
        const body = this.$refs['body'] as HTMLElement | undefined;
        body?.querySelector('.cb-row.working')?.scrollIntoView({ block: 'nearest' });
      });
    },
    // 묶음 하나(최대 100개)를 보내고 결과를 돌려준다
    async runChunk(chunk: Array<string>): Promise<'done' | 'stopped' | 'error'> {
      let done: AiCoverBatchDoneEventDto | null = null;
      let failure: HttpApiError | null = null;
      this.markNextWorking(chunk);
      const stream = markRaw(streamAiCoverBatch({
        postUrls: chunk,
        useAsThumbnail: this.useAsThumbnail,
        insertIntoContent: this.insertIntoContent,
      }, {
        onStatus: (message) => {
          this.status = message;
        },
        onItem: (item) => {
          this.applyItem(item, chunk);
        },
        onDone: (event) => {
          done = event;
        },
        onError: (error) => {
          failure = error;
        },
      }));
      this.stream = stream;
      await stream.finished;
      this.stream = null;

      if (failure) {
        const error = failure as HttpApiError;
        this.error = error.getErrorMessage();
        this.errorCode = errorCodeOf(error);
        return 'error';
      }
      if (!done) {
        return 'stopped';
      }
      const cost = (done as AiCoverBatchDoneEventDto).usage?.costUsd;
      if (typeof cost === 'number') {
        this.costUsd = (this.costUsd ?? 0) + cost;
      }
      return 'done';
    },
    async start() {
      if (!this.canStart || this.phase !== 'select') {
        return;
      }
      const selected = this.posts.filter((post) => this.checked[post.postUrl]);
      this.runRows = selected.map((post) => ({ postUrl: post.postUrl, title: post.title, state: 'queued', message: '', url: '' }));
      this.phase = 'running';
      this.status = '';
      this.costUsd = null;
      this.error = '';
      this.errorCode = '';
      this.isStopping = false;
      (this.$refs['body'] as HTMLElement | undefined)?.scrollTo({ top: 0 });

      const urls = selected.map((post) => post.postUrl);
      let result: 'done' | 'stopped' | 'error' = 'done';
      for (let index = 0; index < urls.length && result === 'done'; index += AI_COVER_BATCH_MAX) {
        result = await this.runChunk(urls.slice(index, index + AI_COVER_BATCH_MAX));
      }

      // 결과가 안 온 글: 멈출 때 만들던 글은 서버가 마저 끝낼 수 있다
      this.runRows.forEach((row) => {
        if (row.state === 'working') {
          row.state = result === 'stopped' ? 'interrupted' : 'cancelled';
        } else if (row.state === 'queued') {
          row.state = 'cancelled';
        }
      });

      // 스트림 시작 전 오류(한도·키 등)로 아무것도 못 했으면 고르기 화면으로 돌아가 메시지만 보여 준다
      if (result === 'error' && this.processedCount === 0) {
        this.phase = 'select';
        this.runRows = [];
        this.$emit('finished');
        return;
      }

      this.phase = result;
      this.status = '';
      if (result === 'done') {
        const { created, skipped, failed } = this.counts;
        const parts = [created > 0 ? `커버 ${created}개를 만들었어요.` : '새로 만든 커버가 없어요.'];
        if (failed > 0) parts.push(`${failed}개는 못 만들었어요.`);
        if (skipped > 0) parts.push(`${skipped}개는 건너뛰었어요.`);
        if (this.costUsd !== null) parts.push(`이번에 ${formatUsd(this.costUsd)} 들었어요.`);
        (failed > 0 || created === 0 ? toast.info : toast.success)(parts.join(' '), 6000);
      } else if (result === 'stopped') {
        toast.info('멈췄어요. 이미 만든 커버는 그대로 남아요.');
      }
      this.$emit('finished');
    },
    stop() {
      if (this.stream) {
        this.isStopping = true;
        this.stream.abort();
      }
    },
    async requestClose() {
      if (this.phase === 'running') {
        const ok = await confirmDialog({
          title: '멈추고 닫을까요?',
          message: '이미 만든 커버는 그대로 남아요. 만들던 글 하나는 마저 끝날 수 있어요.',
          confirmLabel: '멈추고 닫기',
          cancelLabel: '계속 만들기',
        });
        if (!ok || this.phase !== 'running') {
          return;
        }
        this.stop();
      }
      this.$emit('close');
    },
    onKeydown(event: KeyboardEvent) {
      // 확인 창이 떠 있으면 그 창이 Esc 를 받는다
      if (event.key === 'Escape' && !dialogState.confirm) {
        this.requestClose();
      }
    },
  },
  mounted() {
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
    this.stream?.abort();
  },
});
</script>

<style scoped>
.cb-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: var(--s-4);
  background: var(--overlay);
  backdrop-filter: blur(2px);
}

.cb-dialog {
  width: min(620px, 100%);
  max-height: min(86dvh, 820px);
  /* 단계마다 보이는 칸이 달라서 grid 행 대신 세로 flex: 목록만 줄어들고 나머지는 제 높이를 지킨다 */
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.cb-dialog > * {
  flex-shrink: 0;
}

.cb-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-5) var(--s-5) var(--s-3) var(--s-6);
}

.cb-head h2 {
  font-size: var(--text-lg);
}

.cb-head-text {
  display: grid;
  gap: 2px;
}

.cb-progress {
  display: grid;
  gap: 6px;
  margin: 0 var(--s-6) var(--s-3);
  padding: var(--s-3) var(--s-4);
  border-radius: var(--radius);
  background: var(--accent-soft);
}

.cb-progress-row {
  display: flex;
  align-items: flex-start;
  gap: var(--s-2);
}

.cb-progress-row .spinner,
.cb-progress-row .app-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.cb-progress-row .ok {
  color: var(--success);
}

.cb-progress-row .warn {
  color: var(--accent-text);
}

.cb-status {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent-text);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.cb-bar {
  height: 4px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  overflow: hidden;
}

.cb-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width var(--ease);
}

.cb-counts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.cb-counts .dot::before {
  content: '·';
}

.cb-dialog > .cb-body {
  flex: 1 1 auto;
}

.cb-body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.cb-all {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px var(--s-6);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.cb-all .subtle {
  margin-left: auto;
  font-weight: 500;
}

.cb-all input,
.cb-row input {
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.cb-list li + li {
  border-top: 1px solid var(--border);
}

.cb-row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: 10px var(--s-6);
  min-height: 56px;
  box-sizing: border-box;
}

.cb-row.selectable {
  cursor: pointer;
}

.cb-row.selectable:hover {
  background: var(--hover-color);
}

.cb-row-main {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.cb-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cb-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: var(--text-xs);
  color: var(--text-3);
}

.cb-meta .badge {
  height: 18px;
  padding: 0 6px;
}

.cb-state {
  width: 20px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--text-3);
}

.cb-row.working .cb-state,
.cb-row.working .cb-state-label {
  color: var(--accent-text);
}

.cb-row.working {
  background: var(--accent-soft);
}

.cb-row.created .cb-state,
.cb-row.created .cb-state-label {
  color: var(--success);
}

.cb-row.failed .cb-state,
.cb-row.failed .cb-state-label,
.cb-row.failed .cb-message {
  color: var(--danger);
}

.cb-row.skipped .cb-state-label,
.cb-row.interrupted .cb-state-label {
  color: var(--warning);
}

.cb-row.cancelled .cb-title,
.cb-row.queued .cb-title {
  color: var(--text-2);
  font-weight: 500;
}

.cb-state-label {
  font-weight: 600;
}

.cb-message {
  overflow-wrap: anywhere;
}

.cb-thumb {
  width: 76px;
  aspect-ratio: 1200 / 630;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.cb-more {
  padding: var(--s-3) var(--s-6);
  line-height: 1.55;
}

.cb-options {
  display: grid;
  gap: var(--s-3);
  padding: var(--s-4) var(--s-6);
}

.cb-options .check {
  font-size: var(--text-sm);
}

.check-hint {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-3);
  line-height: 1.5;
}

.cb-cost {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  font-size: var(--text-sm);
}

.cost-value {
  font-weight: 700;
}

.error-line {
  color: var(--danger);
}

.cb-error {
  padding: var(--s-3) var(--s-6);
}

.cb-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-6) var(--s-4);
  border-top: 1px solid var(--border);
}

.foot-note {
  margin-right: auto;
}

.spinner {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent);
  animation: cb-spin 0.8s linear infinite;
}

@keyframes cb-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 좁은 화면: 아래에서 올라오는 전체 폭 시트 */
@media (max-width: 640px) {
  .cb-backdrop {
    padding: 0;
    place-items: end stretch;
  }

  .cb-dialog {
    width: 100%;
    max-height: 92dvh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    border-bottom: none;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .cb-head {
    padding: var(--s-4) var(--s-3) var(--s-3) var(--s-4);
  }

  .cb-progress {
    margin: 0 var(--s-4) var(--s-3);
  }

  .cb-all,
  .cb-row,
  .cb-more,
  .cb-options,
  .cb-error,
  .cb-foot {
    padding-left: var(--s-4);
    padding-right: var(--s-4);
  }

  .cb-thumb {
    width: 64px;
  }

  .cb-foot .btn {
    flex: 1;
  }

  .foot-note {
    flex-basis: 100%;
  }

  .cb-foot {
    flex-wrap: wrap;
  }
}
</style>
