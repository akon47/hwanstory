<template>
  <ai-batch-dialog-frame ref="frame" title="제목·요약·태그 한꺼번에 채우기" :subtitle="headline" :progress="progress" :width="760"
                         @close="requestClose">
    <!-- 1. 고르기 -->
    <template v-if="phase === 'select'">
      <label class="mb-all">
        <input type="checkbox" :checked="allChecked" :indeterminate.prop="someChecked" @change="toggleAll"/>
        <span>전체 선택</span>
        <span class="subtle num">{{ formatCount(checkedCount) }} / {{ formatCount(posts.length) }}</span>
      </label>
      <ul class="mb-list">
        <li v-for="post in posts" :key="post.postUrl">
          <label class="mb-pick-row">
            <input type="checkbox" v-model="checked[post.postUrl]"/>
            <span class="mb-row-main">
              <span class="mb-title">{{ post.title || '(제목 없음)' }}</span>
              <span class="mb-meta">
                <span class="num">{{ formatRelativeDate(post.createdAt) }}</span>
                <span class="badge" :class="openTypeBadge(post.openType).className">{{ openTypeBadge(post.openType).label }}</span>
                <span v-if="post.noTags" class="badge badge-accent">태그 없음</span>
                <span v-if="post.shortSummary" class="badge badge-accent">요약 짧음</span>
              </span>
            </span>
          </label>
        </li>
      </ul>
      <p v-if="total > posts.length" class="small subtle mb-more">
        대상 글이 {{ formatCount(total) }}개라 최근 {{ formatCount(posts.length) }}개만 보여요. 다 채우면 나머지가 이어서 보여요.
      </p>
    </template>

    <!-- 2·3. 제안 받기·고르기 -->
    <ul v-else class="mb-list">
      <li v-for="row in rows" :key="row.postUrl" class="mb-row" :class="row.state">
        <div class="mb-row-head">
          <span class="mb-state" :aria-label="stateLabel(row.state)">
            <span v-if="row.state === 'working'" class="spinner" aria-hidden="true"/>
            <app-icon v-else :name="stateIcon(row.state)" :size="16"/>
          </span>
          <span class="mb-title">{{ row.title || '(제목 없음)' }}</span>
          <span class="mb-state-label">{{ stateLabel(row.state) }}</span>
        </div>
        <p v-if="row.message" class="mb-message">{{ row.message }}</p>
        <div v-if="row.current && row.suggested" class="mb-fields">
          <div v-for="field in requestedFields" :key="field" class="mb-field"
               :class="{ off: !row.picks[field], same: isSame(row, field) }">
            <label class="mb-field-name">
              <input type="checkbox" v-model="row.picks[field]" :disabled="!canPick(row, field)"/>
              <span>{{ fieldLabels[field] }}</span>
              <span v-if="isSame(row, field)" class="subtle mb-same">지금과 같아요</span>
            </label>
            <!-- 지금과 같은 항목은 한 줄로만 -->
            <div v-if="!isSame(row, field)" class="mb-compare">
              <div class="mb-side now">
                <span class="mb-side-label">지금</span>
                <template v-if="field === 'tags'">
                  <span v-if="row.current.tags.length" class="mb-chips">
                    <span v-for="tag in row.current.tags" :key="tag" class="chip chip-neutral">{{ tag }}</span>
                  </span>
                  <span v-else class="mb-empty">비어 있어요</span>
                </template>
                <span v-else-if="row.current[field]" class="mb-text">{{ row.current[field] }}</span>
                <span v-else class="mb-empty">비어 있어요</span>
              </div>
              <div class="mb-side next">
                <span class="mb-side-label">제안</span>
                <template v-if="field === 'tags'">
                  <span class="mb-chips">
                    <span v-for="tag in row.suggested.tags" :key="tag" class="chip">{{ tag }}</span>
                  </span>
                </template>
                <span v-else class="mb-text">{{ row.suggested[field] }}</span>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>

    <template #bottom>
      <div v-if="phase === 'select'" class="mb-options">
        <div class="mb-option-group">
          <span class="mb-option-label">채울 항목</span>
          <label class="check"><input type="checkbox" v-model="fieldChoice.summary"/><span>요약</span></label>
          <label class="check"><input type="checkbox" v-model="fieldChoice.tags"/><span>태그</span></label>
          <label class="check"><input type="checkbox" v-model="fieldChoice.title"/><span>제목</span></label>
        </div>
        <p class="small subtle">옛 글 제목은 웬만하면 그대로 두는 걸 추천해요.</p>
        <p class="mb-cost">
          <span>예상 비용</span>
          <span class="cost-value num">약 {{ costRangeText(costRange, checkedCount) }}</span>
          <span class="subtle">글 하나에 약 {{ costRangeText(costRange, 1) }}</span>
        </p>
        <p v-if="checkedCount > batchMax" class="small subtle">한 번에 {{ batchMax }}개씩 나눠서 차례로 받아요.</p>
        <p v-if="selectedFields.length === 0" class="small error-line">채울 항목을 하나 이상 골라 주세요.</p>
      </div>
      <p v-if="phase !== 'applied'" class="mb-notice small">
        <app-icon name="info" :size="14"/>
        <span>{{ phase === 'select' ? '제안만 받아요. ' : '' }}적용을 누르기 전에는 글이 바뀌지 않아요.</span>
      </p>
      <div v-if="error" class="mb-error">
        <ai-error-box :message="error" :code="errorCode" :settings-link="false"/>
      </div>
    </template>

    <template #foot>
      <template v-if="phase === 'select'">
        <button class="btn btn-secondary foot-btn" type="button" @click="requestClose">취소</button>
        <button class="btn foot-btn" type="button" :disabled="!canStart" @click="start">
          <app-icon name="sparkles" :size="16"/>제안 받기 ({{ formatCount(checkedCount) }}개)
        </button>
      </template>
      <template v-else-if="phase === 'running'">
        <span class="small muted foot-note">멈춰도 받은 제안은 남아요.</span>
        <button class="btn btn-secondary foot-btn" type="button" :disabled="isStopping" @click="stop">
          {{ isStopping ? '멈추는 중…' : '멈추기' }}
        </button>
      </template>
      <template v-else-if="phase === 'review' || phase === 'applying'">
        <button class="btn btn-secondary foot-btn" type="button" :disabled="phase === 'applying'" @click="requestClose">닫기</button>
        <button class="btn foot-btn" type="button" :disabled="applyCount === 0 || phase === 'applying'" @click="apply">
          <app-icon name="check" :size="16"/>{{ phase === 'applying' ? '적용하고 있어요…' : `선택한 것 적용 (${formatCount(applyCount)}개 글)` }}
        </button>
      </template>
      <template v-else>
        <button class="btn foot-btn" type="button" @click="$emit('close')">닫기</button>
      </template>
    </template>
  </ai-batch-dialog-frame>
</template>

<script lang="ts">
import { defineComponent, markRaw, PropType } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import AiErrorBox from '@/components/ai/AiErrorBox.vue';
import AiBatchDialogFrame from '@/components/ai/AiBatchDialogFrame.vue';
import { BATCH_MAX, BatchProgress, chunked, costRangeText, openTypeBadge } from '@/components/ai/aiBatch';
import { applyAiMetaBatch, streamAiMetaBatch } from '@/api/ai';
import {
  AI_META_COST_RANGE,
  AiMetaApplyItemDto,
  AiMetaBatchDoneEventDto,
  AiMetaBatchField,
  AiMetaBatchItemEventDto,
  AiMetaCandidatePostDto,
  AiMetaValuesDto,
} from '@/api/models/ai.dtos';
import { HttpApiError } from '@/api/common/httpApiClient';
import { errorCodeOf, SseStream } from '@/api/common/sseClient';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatCount, formatRelativeDate, formatUsd } from '@/utils/format';

type RowState = 'queued' | 'working' | 'ready' | 'failed' | 'cancelled' | 'applied' | 'applyFailed';

interface MetaRow {
  postUrl: string;
  title: string;
  state: RowState;
  message: string;
  current: AiMetaValuesDto | null;
  suggested: AiMetaValuesDto | null;
  // 필드별로 적용할지
  picks: Record<AiMetaBatchField, boolean>;
}

// 보여 주는 순서
const FIELD_ORDER: Array<AiMetaBatchField> = ['title', 'summary', 'tags'];
const FIELD_LABELS: Record<AiMetaBatchField, string> = { title: '제목', summary: '요약', tags: '태그' };

const STATE_LABELS: Record<RowState, string> = {
  queued: '기다리는 중',
  working: '제안 만드는 중',
  ready: '제안 받음',
  failed: '실패',
  cancelled: '받지 않았어요',
  applied: '적용했어요',
  applyFailed: '적용 못 했어요',
};

const STATE_ICONS: Record<RowState, string> = {
  queued: 'clock',
  working: 'clock',
  ready: 'sparkles',
  failed: 'alert',
  cancelled: 'x',
  applied: 'check-circle',
  applyFailed: 'alert',
};

function sameValue(field: AiMetaBatchField, current: AiMetaValuesDto, suggested: AiMetaValuesDto): boolean {
  if (field === 'tags') {
    return JSON.stringify(current.tags ?? []) === JSON.stringify(suggested.tags ?? []);
  }
  return (current[field] ?? '').trim() === (suggested[field] ?? '').trim();
}

// 설정 > AI 글쓰기 카드에서 여는 "제목·요약·태그 한꺼번에 채우기" 창.
// 1) 글·항목 고르기 → 2) /meta/batch(SSE) 로 제안만 받기(글은 안 바뀜) → 3) 항목별로 골라 /meta/apply 로 적용.
export default defineComponent({
  name: 'AiMetaBatchDialog',
  components: { AppIcon, AiErrorBox, AiBatchDialogFrame },
  props: {
    posts: {
      type: Array as PropType<Array<AiMetaCandidatePostDto>>,
      required: true,
    },
    // 대상 글 전체 수 (posts 는 최대 500개)
    total: {
      type: Number,
      required: true,
    },
  },
  // finished: 제안을 받았거나(사용량) 적용했으면(남은 수) 카드가 다시 받는다
  emits: ['close', 'finished'],
  data() {
    const checked: Record<string, boolean> = {};
    this.posts.forEach((post) => {
      checked[post.postUrl] = true;
    });
    return {
      checked,
      // 제목은 기본으로 끈다 (옛 글 제목은 웬만하면 그대로)
      fieldChoice: { title: false, summary: true, tags: true } as Record<AiMetaBatchField, boolean>,
      requestedFields: [] as Array<AiMetaBatchField>,
      phase: 'select' as 'select' | 'running' | 'review' | 'applying' | 'applied',
      streamResult: 'done' as 'done' | 'stopped' | 'error',
      rows: [] as Array<MetaRow>,
      status: '',
      costUsd: null as number | null,
      appliedCount: 0,
      applyFailedCount: 0,
      error: '',
      errorCode: '',
      isStopping: false,
      stream: null as SseStream | null,
      batchMax: BATCH_MAX,
      costRange: AI_META_COST_RANGE,
      fieldLabels: FIELD_LABELS,
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
    selectedFields(): Array<AiMetaBatchField> {
      return FIELD_ORDER.filter((field) => this.fieldChoice[field]);
    },
    canStart(): boolean {
      return this.checkedCount > 0 && this.selectedFields.length > 0;
    },
    counts(): { ready: number; failed: number } {
      return {
        ready: this.rows.filter((row) => row.state === 'ready' || row.state === 'applied' || row.state === 'applyFailed').length,
        failed: this.rows.filter((row) => row.state === 'failed').length,
      };
    },
    processedCount(): number {
      return this.counts.ready + this.counts.failed;
    },
    // 적용할 항목이 하나라도 있는 글 수
    applyCount(): number {
      return this.rows.filter((row) => this.applyItemOf(row) !== null).length;
    },
    headline(): string {
      if (this.phase === 'select') {
        return `요약·태그가 비었거나 짧은 글 ${formatCount(this.total)}개 중에서 고를 수 있어요.`;
      }
      return `고른 글 ${formatCount(this.rows.length)}개 · ${this.requestedFields.map((field) => FIELD_LABELS[field]).join('·')}`;
    },
    progress(): BatchProgress | null {
      if (this.phase === 'select') {
        return null;
      }
      const detail = [`${formatCount(this.processedCount)} / ${formatCount(this.rows.length)}`, `제안 ${this.counts.ready}`];
      if (this.counts.failed) detail.push(`실패 ${this.counts.failed}`);
      const percent = this.rows.length ? Math.round((this.processedCount / this.rows.length) * 100) : 0;
      if (this.phase === 'running') {
        return { state: 'running', text: this.status || '준비하고 있어요', percent, detail: detail.join(' · ') };
      }
      if (this.phase === 'applying') {
        return { state: 'running', text: '고른 것을 글에 적용하고 있어요', percent: 100, detail: detail.join(' · ') };
      }
      if (this.phase === 'applied') {
        const text = this.applyFailedCount > 0
            ? `${formatCount(this.appliedCount)}개 글에 적용했어요. ${formatCount(this.applyFailedCount)}개는 못 했어요.`
            : `${formatCount(this.appliedCount)}개 글에 적용했어요.`;
        return { state: 'done', text, percent: 100, detail: detail.join(' · ') };
      }
      // review
      if (this.streamResult === 'done') {
        const cost = this.costUsd !== null ? ` 이번에 ${formatUsd(this.costUsd)} 들었어요.` : '';
        return { state: 'done', text: `제안을 다 받았어요.${cost} 적용할 것만 남겨 두세요.`, percent, detail: detail.join(' · ') };
      }
      const text = this.streamResult === 'stopped'
          ? '멈췄어요. 받은 제안까지는 골라서 적용할 수 있어요.'
          : '중간에 멈췄어요. 받은 제안까지는 골라서 적용할 수 있어요.';
      return { state: this.streamResult, text, percent, detail: detail.join(' · ') };
    },
  },
  methods: {
    formatCount,
    formatRelativeDate,
    openTypeBadge,
    costRangeText,
    stateLabel(state: RowState): string {
      return STATE_LABELS[state];
    },
    stateIcon(state: RowState): string {
      return STATE_ICONS[state];
    },
    bodyElement(): HTMLElement | undefined {
      return (this.$refs['frame'] as InstanceType<typeof AiBatchDialogFrame> | undefined)?.bodyElement();
    },
    isSame(row: MetaRow, field: AiMetaBatchField): boolean {
      return !!row.current && !!row.suggested && sameValue(field, row.current, row.suggested);
    },
    canPick(row: MetaRow, field: AiMetaBatchField): boolean {
      return row.state === 'ready' && !this.isSame(row, field) && (this.phase === 'running' || this.phase === 'review');
    },
    // 그 글에서 고른 항목만 담은 적용 요청 (고른 게 없으면 null)
    applyItemOf(row: MetaRow): AiMetaApplyItemDto | null {
      if (row.state !== 'ready' || !row.suggested) {
        return null;
      }
      const suggested = row.suggested;
      const picked = this.requestedFields.filter((field) => row.picks[field] && !this.isSame(row, field));
      if (picked.length === 0) {
        return null;
      }
      return {
        postUrl: row.postUrl,
        title: picked.includes('title') ? suggested.title : undefined,
        summary: picked.includes('summary') ? suggested.summary : undefined,
        tags: picked.includes('tags') ? suggested.tags : undefined,
      };
    },
    toggleAll() {
      const next = !this.allChecked;
      this.posts.forEach((post) => {
        this.checked[post.postUrl] = next;
      });
    },
    markNextWorking(chunk: Array<string>) {
      const next = this.rows.find((row) => row.state === 'queued' && chunk.includes(row.postUrl));
      if (next) {
        next.state = 'working';
      }
    },
    applyEvent(item: AiMetaBatchItemEventDto, chunk: Array<string>) {
      const row = this.rows.find((candidate) => candidate.postUrl === item.postUrl);
      if (row) {
        if (item.ok && item.current && item.suggested) {
          row.state = 'ready';
          row.current = markRaw({ ...item.current, tags: item.current.tags ?? [] });
          row.suggested = markRaw({ ...item.suggested, tags: item.suggested.tags ?? [] });
          // 요청한 항목은 켜 두고(제목은 사용자가 켰을 때만 요청된다), 지금과 같으면 끈다
          this.requestedFields.forEach((field) => {
            row.picks[field] = !this.isSame(row, field);
          });
        } else {
          row.state = 'failed';
          row.message = item.message ?? '제안을 받지 못했어요.';
        }
      }
      this.rows.forEach((candidate) => {
        if (candidate.state === 'working' && candidate.postUrl !== item.postUrl) {
          candidate.state = 'queued';
        }
      });
      this.markNextWorking(chunk);
    },
    async runChunk(chunk: Array<string>): Promise<'done' | 'stopped' | 'error'> {
      let done: AiMetaBatchDoneEventDto | null = null;
      let failure: HttpApiError | null = null;
      this.markNextWorking(chunk);
      const stream = markRaw(streamAiMetaBatch({ postUrls: chunk, fields: this.requestedFields }, {
        onStatus: (message) => {
          this.status = message;
        },
        onItem: (item) => {
          this.applyEvent(item, chunk);
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
      const cost = (done as AiMetaBatchDoneEventDto).usage?.costUsd;
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
      this.requestedFields = [...this.selectedFields];
      this.rows = selected.map((post) => ({
        postUrl: post.postUrl,
        title: post.title,
        state: 'queued',
        message: '',
        current: null,
        suggested: null,
        picks: { title: false, summary: false, tags: false },
      }));
      this.phase = 'running';
      this.status = '';
      this.costUsd = null;
      this.error = '';
      this.errorCode = '';
      this.isStopping = false;
      this.bodyElement()?.scrollTo({ top: 0 });

      let result: 'done' | 'stopped' | 'error' = 'done';
      for (const chunk of chunked(selected.map((post) => post.postUrl))) {
        result = await this.runChunk(chunk);
        if (result !== 'done') {
          break;
        }
      }
      this.rows.forEach((row) => {
        if (row.state === 'working' || row.state === 'queued') {
          row.state = 'cancelled';
        }
      });
      this.$emit('finished');

      // 스트림 시작 전 오류(한도·키 등)로 아무것도 못 받았으면 고르기 화면으로 돌아가 메시지만 보여 준다
      if (result === 'error' && this.processedCount === 0) {
        this.phase = 'select';
        this.rows = [];
        return;
      }
      this.streamResult = result;
      this.phase = 'review';
      this.status = '';
      if (result === 'stopped') {
        toast.info('멈췄어요. 받은 제안까지는 골라서 적용할 수 있어요.');
      }
    },
    stop() {
      if (this.stream) {
        this.isStopping = true;
        this.stream.abort();
      }
    },
    async apply() {
      if (this.phase !== 'review') {
        return;
      }
      const entries = this.rows
      .map((row) => ({ row, item: this.applyItemOf(row) }))
      .filter((entry): entry is { row: MetaRow; item: AiMetaApplyItemDto } => entry.item !== null);
      if (entries.length === 0) {
        return;
      }
      this.phase = 'applying';
      this.error = '';
      this.errorCode = '';
      let applied = 0;
      let failed = 0;
      for (const chunk of chunked(entries)) {
        try {
          const result = await applyAiMetaBatch({ items: chunk.map((entry) => entry.item) });
          const failures = new Map((result.failed ?? []).map((failure) => [failure.postUrl, failure.message]));
          chunk.forEach(({ row }) => {
            if (failures.has(row.postUrl)) {
              row.state = 'applyFailed';
              row.message = failures.get(row.postUrl) || '적용하지 못했어요.';
            } else {
              row.state = 'applied';
            }
          });
          applied += result.applied ?? chunk.length - failures.size;
          failed += failures.size;
        } catch (e) {
          // 이 묶음은 그대로 두고 멈춘다 (다시 적용할 수 있게)
          const error = e as HttpApiError;
          this.error = error.getErrorMessage();
          this.errorCode = errorCodeOf(error);
          break;
        }
      }
      this.appliedCount += applied;
      this.applyFailedCount += failed;
      // 아직 적용 안 한(오류로 멈춘) 글이 남았으면 다시 누를 수 있게 고르기 단계로
      this.phase = this.rows.some((row) => this.applyItemOf(row) !== null) ? 'review' : 'applied';
      if (applied > 0 || failed > 0) {
        const message = failed > 0
            ? `${formatCount(applied)}개 글에 적용했어요. ${formatCount(failed)}개는 못 했어요.`
            : `${formatCount(applied)}개 글에 적용했어요.`;
        (failed > 0 ? toast.info : toast.success)(message, 5000);
        this.$emit('finished');
      }
    },
    async requestClose() {
      if (this.phase === 'applying') {
        return;
      }
      if (this.phase === 'running') {
        const ok = await confirmDialog({
          title: '멈추고 닫을까요?',
          message: '받은 제안은 사라지고, 글은 하나도 바뀌지 않아요.',
          confirmLabel: '멈추고 닫기',
          cancelLabel: '계속 받기',
        });
        if (!ok || this.phase !== 'running') {
          return;
        }
        this.stop();
      } else if (this.phase === 'review' && this.applyCount > 0) {
        const ok = await confirmDialog({
          title: '적용하지 않고 닫을까요?',
          message: '받은 제안은 사라지고, 글은 바뀌지 않아요. 제안을 받는 데 든 비용은 돌아오지 않아요.',
          confirmLabel: '닫기',
          cancelLabel: '계속 고르기',
        });
        if (!ok) {
          return;
        }
      }
      this.$emit('close');
    },
  },
  beforeUnmount() {
    this.stream?.abort();
  },
});
</script>

<style scoped>
.mb-all {
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

.mb-all .subtle {
  margin-left: auto;
  font-weight: 500;
}

.mb-all input,
.mb-pick-row input,
.mb-field-name input {
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.mb-list li + li {
  border-top: 1px solid var(--border);
}

.mb-pick-row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: 10px var(--s-6);
  min-height: 56px;
  box-sizing: border-box;
  cursor: pointer;
}

.mb-pick-row:hover {
  background: var(--hover-color);
}

.mb-row-main {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.mb-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.mb-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: var(--text-xs);
  color: var(--text-3);
}

.mb-meta .badge {
  height: 18px;
  padding: 0 6px;
}

.mb-more {
  padding: var(--s-3) var(--s-6);
  line-height: 1.55;
}

/* 제안 줄 */
.mb-row {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-6);
}

.mb-row.working {
  background: var(--accent-soft);
}

.mb-row-head {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}

.mb-row-head .mb-title {
  flex: 1;
}

.mb-state {
  width: 18px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--text-3);
}

.mb-state-label {
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-3);
}

.mb-row.working .mb-state,
.mb-row.working .mb-state-label,
.mb-row.ready .mb-state {
  color: var(--accent-text);
}

.mb-row.applied .mb-state,
.mb-row.applied .mb-state-label {
  color: var(--success);
}

.mb-row.failed .mb-state,
.mb-row.failed .mb-state-label,
.mb-row.applyFailed .mb-state,
.mb-row.applyFailed .mb-state-label,
.mb-message {
  color: var(--danger);
}

.mb-row.cancelled .mb-title,
.mb-row.queued .mb-title {
  color: var(--text-2);
  font-weight: 500;
}

.mb-message {
  font-size: var(--text-xs);
  padding-left: 26px;
  overflow-wrap: anywhere;
}

.mb-fields {
  display: grid;
  gap: var(--s-2);
  padding-left: 26px;
}

.mb-field {
  display: grid;
  gap: 6px;
}

.mb-field-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-2);
  cursor: pointer;
  justify-self: start;
}

.mb-same {
  font-weight: 500;
}

.mb-compare {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--s-2);
}

.mb-side {
  display: grid;
  align-content: start;
  gap: 4px;
  padding: var(--s-2) var(--s-3);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  font-size: var(--text-sm);
  line-height: 1.55;
  min-width: 0;
  transition: opacity var(--ease);
}

.mb-side.next {
  background: var(--accent-soft);
}

.mb-field.off .mb-side.next,
.mb-field.same .mb-side.next {
  opacity: 0.5;
}

.mb-side-label {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-3);
}

.mb-side.next .mb-side-label {
  color: var(--accent-text);
}

.mb-text {
  color: var(--text);
  overflow-wrap: anywhere;
}

.mb-empty {
  color: var(--text-3);
}

.mb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mb-chips .chip {
  height: 22px;
  padding: 0 8px;
}

/* 제안 칸 바탕이 강조색이라 칩은 흰 바탕으로 */
.mb-side.next .chip {
  background: var(--surface);
}

/* 아래 옵션·안내 */
.mb-options {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-4) var(--s-6) 0;
}

.mb-option-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2) var(--s-5);
  font-size: var(--text-sm);
}

.mb-option-group .check {
  align-items: center;
}

.mb-option-group .check input {
  margin-top: 0;
}

.mb-option-label {
  font-weight: 700;
  color: var(--text-2);
}

.mb-cost {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  font-size: var(--text-sm);
  margin-top: var(--s-1);
}

.cost-value {
  font-weight: 700;
}

.error-line {
  color: var(--danger);
}

.mb-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: var(--s-3) var(--s-6);
  color: var(--text-2);
}

.mb-notice .app-icon {
  flex-shrink: 0;
  color: var(--accent-text);
}

.mb-error {
  padding: 0 var(--s-6) var(--s-3);
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
  animation: mb-spin 0.8s linear infinite;
}

@keyframes mb-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 좁은 화면: 지금 위에 제안 */
@media (max-width: 640px) {
  .mb-all,
  .mb-pick-row,
  .mb-row,
  .mb-more,
  .mb-error {
    padding-left: var(--s-4);
    padding-right: var(--s-4);
  }

  .mb-options {
    padding-left: var(--s-4);
    padding-right: var(--s-4);
  }

  .mb-notice {
    margin-left: var(--s-4);
    margin-right: var(--s-4);
  }

  .mb-compare {
    grid-template-columns: minmax(0, 1fr);
  }

  .mb-fields,
  .mb-message {
    padding-left: 0;
  }

  .foot-btn {
    flex: 1;
  }

  .foot-note {
    flex-basis: 100%;
  }
}
</style>
