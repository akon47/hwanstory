<template>
  <aside class="ai-write-panel" :class="{ collapsed: isCollapsed }" aria-label="AI 글쓰기">
    <header class="panel-head">
      <button class="head-title" type="button" :aria-expanded="!isCollapsed" @click="toggleCollapse">
        <span class="head-icon"><app-icon name="sparkles" :size="16"/></span>
        <span class="head-text">
          <span class="head-name">AI 글쓰기</span>
          <span v-if="activeStatus" class="head-status">{{ activeStatus }}</span>
          <span v-else-if="modelLabel" class="head-model">{{ modelLabel }}</span>
        </span>
        <app-icon class="collapse-icon" :name="isCollapsed ? 'chevron-up' : 'chevron-down'" :size="18"/>
      </button>
      <button v-if="isCollapsed && isStreaming" class="btn btn-secondary btn-sm" type="button" @click="stopStreaming">멈추기</button>
      <button class="btn btn-icon btn-sm" type="button" title="닫기" aria-label="AI 글쓰기 닫기" @click="$emit('close')">
        <app-icon name="x" :size="18"/>
      </button>
    </header>

    <!-- 설정 불러오는 중 / 실패 / 기능 꺼짐 / 키 없음 -->
    <div v-if="settingsState === 'loading'" class="panel-body">
      <div class="skeleton sk-line"/>
      <div class="skeleton sk-block"/>
      <div class="skeleton sk-line short"/>
    </div>
    <div v-else-if="settingsState === 'error'" class="panel-body">
      <div class="notice">
        <app-icon name="alert" :size="18"/>
        <div>
          <p>{{ settingsError }}</p>
          <button class="btn btn-secondary btn-sm" type="button" @click="loadSettings()">다시 불러오기</button>
        </div>
      </div>
    </div>
    <div v-else-if="settings && !settings.available" class="panel-body">
      <div class="notice">
        <app-icon name="info" :size="18"/>
        <p>지금은 AI 글쓰기를 쓸 수 없어요. 서버에서 기능이 꺼져 있어요.</p>
      </div>
    </div>
    <div v-else-if="settings && !settings.configured" class="panel-body">
      <div class="setup">
        <div class="setup-icon"><app-icon name="key" :size="22"/></div>
        <p class="setup-title">API 키를 먼저 넣어 주세요</p>
        <p class="muted small">
          AI 글쓰기는 내 Anthropic API 키로 동작해요. 설정에서 키를 넣으면 초안 쓰기, 다듬기, 요약·태그, 커버 이미지, 영어판을 쓸 수 있어요.
        </p>
        <div class="setup-actions">
          <a class="btn btn-sm" href="/setting#ai" target="_blank" rel="noopener">
            설정에서 키 넣기<app-icon name="external-link" :size="14"/>
          </a>
          <button class="btn btn-ghost btn-sm" type="button" @click="loadSettings()">키를 넣었어요</button>
        </div>
      </div>
    </div>

    <template v-else-if="settings">
      <nav class="tabs panel-tabs" role="tablist">
        <button v-for="item in tabs" :key="item.key" type="button" role="tab" :class="{ active: tab === item.key }"
                :aria-selected="tab === item.key" @click="tab = item.key">
          {{ item.label }}
        </button>
      </nav>

      <div ref="body" class="panel-body">
        <!-- 초안 쓰기 -->
        <section v-show="tab === 'draft'" class="tab-pane">
          <div class="field">
            <label for="ai-draft-request">무엇에 대해 쓸까요?</label>
            <textarea id="ai-draft-request" class="textarea" v-model="draft.request" rows="4" :disabled="isBusy"
                      placeholder="예: 오늘 나온 CVE-2026-114938 자바 보안 취약점이 어떤 문제이고 어떻게 막는지 정리해 줘"/>
          </div>
          <div class="field">
            <label for="ai-draft-notes">메모 <span class="optional">선택</span></label>
            <textarea id="ai-draft-notes" class="textarea notes" v-model="draft.notes" rows="2" :disabled="isBusy"
                      placeholder="꼭 넣을 내용이나 순서가 있으면 적어 주세요"/>
          </div>
          <div class="field">
            <span class="label">길이</span>
            <div class="segmented" role="radiogroup" aria-label="길이">
              <button v-for="option in lengths" :key="option.value" type="button" role="radio"
                      :class="{ active: draft.length === option.value }" :aria-checked="draft.length === option.value"
                      :disabled="isBusy" @click="draft.length = option.value">
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="toggles">
            <label class="check">
              <input type="checkbox" v-model="draft.webResearch" :disabled="isBusy"/>
              <span>웹에서 최신 자료 찾기<span class="check-hint">찾은 자료는 글 끝에 출처로 달아요</span></span>
            </label>
            <label class="check">
              <input type="checkbox" v-model="draft.fillMeta" :disabled="isBusy"/>
              <span>제목·요약·태그 채우기<span class="check-hint">비어 있는 칸만 채워요</span></span>
            </label>
            <label class="check">
              <input type="checkbox" v-model="draft.addCover" :disabled="isBusy"/>
              <span>커버 이미지 넣기<span class="check-hint">글 맨 위와 썸네일에 들어가요</span></span>
            </label>
          </div>
          <button class="btn btn-block" type="button" :disabled="isBusy || !draft.request.trim()" @click="startDraft">
            <app-icon name="sparkles" :size="16"/>초안 쓰기
          </button>
          <p class="hint style-hint">{{ styleHint }}</p>

          <div v-if="draft.phase === 'streaming' || draft.phase === 'finishing'" class="progress draft-progress" aria-live="polite">
            <div class="progress-row">
              <span class="spinner" aria-hidden="true"/>
              <span class="progress-status">{{ draft.status || '준비하고 있어요' }}</span>
            </div>
            <div class="progress-row sub">
              <span class="subtle small num">{{ formatCount(draft.chars) }}자 썼어요</span>
              <button v-if="draft.phase === 'streaming'" class="btn btn-secondary btn-sm" type="button" @click="stopStreaming">
                멈추기
              </button>
            </div>
          </div>

          <div v-if="draft.phase === 'done'" class="result draft-result">
            <div class="result-head">
              <app-icon class="ok" name="check-circle" :size="18"/>
              <span class="result-title">초안을 다 썼어요</span>
              <span v-if="draft.cost !== null" class="badge num">{{ formatUsd(draft.cost) }}</span>
            </div>
            <ul v-if="draft.steps.length > 0" class="steps">
              <li v-for="step in draft.steps" :key="step.key" :class="step.state">
                <app-icon :name="step.state === 'failed' ? 'alert' : 'check'" :size="14"/>
                <span>{{ step.message }}</span>
              </li>
            </ul>
            <p v-if="draft.madeDraft" class="small muted">공개 설정을 임시저장으로 바꿔 두었어요. 읽어 보고 다듬은 뒤 직접 공개해 주세요.</p>
          </div>

          <div v-if="draft.phase === 'stopped'" class="notice subtle-notice">
            <app-icon name="info" :size="18"/>
            <p>멈췄어요. 여기까지 쓴 글은 에디터에 그대로 두었어요.</p>
          </div>

          <ai-error-box v-if="draft.error" :message="draft.error" :code="draft.errorCode"/>

          <div v-if="draft.sources.length > 0" class="sources">
            <div class="sources-title">참고한 자료</div>
            <ol>
              <li v-for="source in draft.sources" :key="source.url">
                <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title || source.url }}</a>
                <span class="source-host">{{ hostOf(source.url) }}</span>
              </li>
            </ol>
          </div>
        </section>

        <!-- 다듬기 -->
        <section v-show="tab === 'rewrite'" class="tab-pane">
          <div class="selection" :class="{ empty: !selectionPreview }">
            <div class="selection-head">
              <span>{{ rewrite.phase === 'idle' ? '고른 부분' : '원래 글' }}</span>
              <span v-if="selectionPreview" class="subtle num">{{ formatCount(selectionPreview.length) }}자</span>
            </div>
            <p v-if="selectionPreview" class="selection-text">{{ selectionPreview }}</p>
            <p v-else class="selection-text placeholder">에디터에서 다듬을 문장이나 문단을 드래그해서 골라 주세요.</p>
          </div>
          <div class="chips" role="group" aria-label="어떻게 다듬을까요">
            <button v-for="option in rewriteOptions" :key="option.value" class="btn btn-secondary btn-sm btn-pill" type="button"
                    :disabled="isBusy" @click="startRewrite(option.value)">
              {{ option.label }}
            </button>
          </div>
          <form class="custom-row" @submit.prevent="startRewrite('custom')">
            <input class="input" type="text" v-model="rewrite.custom" maxlength="200" :disabled="isBusy"
                   placeholder="직접 말하기 (예: 더 친근하게, 예시 하나 넣기)" aria-label="다듬는 방법 직접 쓰기"/>
            <button class="btn btn-icon send" type="submit" :disabled="isBusy || !rewrite.custom.trim()" aria-label="보내기"
                    title="보내기">
              <app-icon name="send" :size="16"/>
            </button>
          </form>

          <div v-if="rewrite.phase !== 'idle'" class="result rewrite-result" aria-live="polite">
            <div class="result-head">
              <span v-if="rewrite.phase === 'streaming'" class="spinner" aria-hidden="true"/>
              <span class="result-title">다듬은 글</span>
              <span v-if="rewrite.label" class="badge badge-accent">{{ rewrite.label }}</span>
              <span v-if="rewrite.cost !== null" class="badge num">{{ formatUsd(rewrite.cost) }}</span>
            </div>
            <p v-if="rewrite.phase === 'streaming' && !rewrite.result" class="subtle small">{{ rewrite.status || '다듬고 있어요' }}</p>
            <p v-if="rewrite.result" class="result-text">{{ rewrite.result }}</p>
            <div class="result-actions">
              <template v-if="rewrite.phase === 'streaming'">
                <button class="btn btn-secondary btn-sm" type="button" @click="stopStreaming">멈추기</button>
              </template>
              <template v-else>
                <button class="btn btn-sm" type="button" :disabled="!rewrite.result.trim()" @click="applyRewrite">
                  <app-icon name="check" :size="14"/>바꾸기
                </button>
                <button class="btn btn-secondary btn-sm" type="button" :disabled="isBusy" @click="regenerateRewrite">다시</button>
                <button class="btn btn-ghost btn-sm" type="button" @click="resetRewrite">버리기</button>
              </template>
            </div>
          </div>

          <ai-error-box v-if="rewrite.error" :message="rewrite.error" :code="rewrite.errorCode"/>
        </section>

        <!-- 정리 -->
        <section v-show="tab === 'meta'" class="tab-pane">
          <div class="block">
            <div class="block-title">제목·요약·태그</div>
            <p class="small muted">지금 쓴 글을 읽고 제목, 한 줄 요약, 태그, 글 주소를 골라 드려요. 비어 있는 칸은 바로 채워요.</p>
            <button class="btn btn-secondary btn-block" type="button" :disabled="isBusy" @click="runMeta">
              <span v-if="meta.phase === 'loading'" class="spinner" aria-hidden="true"/>
              <app-icon v-else name="tag" :size="16"/>{{ meta.phase === 'loading' ? '고르고 있어요' : '제목·요약·태그 채우기' }}
            </button>
            <ul v-if="meta.result" class="meta-list">
              <li v-for="row in metaRows" :key="row.field">
                <div class="meta-label">{{ row.label }}</div>
                <div class="meta-value" :class="{ mono: row.field === 'postUrl' }">
                  <template v-if="row.field === 'tags'">
                    <span v-for="tag in meta.result.tags" :key="tag" class="chip chip-neutral">{{ tag }}</span>
                  </template>
                  <template v-else>{{ row.value }}</template>
                </div>
                <div class="meta-action">
                  <span v-if="row.same" class="applied"><app-icon name="check" :size="14"/>{{ row.filled ? '채웠어요' : '같아요' }}</span>
                  <button v-else-if="row.canApply" class="btn btn-ghost btn-sm" type="button" @click="applyMetaRow(row.field)">바꾸기</button>
                </div>
              </li>
            </ul>
            <ai-error-box v-if="meta.error" :message="meta.error" :code="meta.errorCode"/>
          </div>

          <div class="block">
            <div class="block-title">커버 이미지</div>
            <p class="small muted">글에 어울리는 커버(1200×630)를 그려서 글 맨 위에 넣고 썸네일로 써요.</p>
            <button class="btn btn-secondary btn-block" type="button" :disabled="isBusy" @click="runCover">
              <span v-if="cover.phase === 'loading'" class="spinner" aria-hidden="true"/>
              <app-icon v-else name="image" :size="16"/>{{ cover.phase === 'loading' ? '그리고 있어요' : '커버 이미지 만들기' }}
            </button>
            <figure v-if="cover.result" class="cover-preview">
              <img :src="coverImageUrl" alt="만든 커버 이미지" loading="lazy"/>
              <figcaption class="small subtle">글 맨 위에 넣었어요. 저장하면 썸네일로도 쓰여요.</figcaption>
            </figure>
            <ai-error-box v-if="cover.error" :message="cover.error" :code="cover.errorCode"/>
          </div>
        </section>

        <!-- 영어판 -->
        <section v-show="tab === 'translate'" class="tab-pane">
          <p class="small muted">이 글을 영어로 옮겨요. 다 옮기면 영어판을 새 글로 임시저장할 수 있어요.</p>
          <button v-if="translate.phase !== 'streaming'" class="btn btn-secondary btn-block" type="button" :disabled="isBusy"
                  @click="startTranslate">
            <app-icon name="globe" :size="16"/>{{ translate.phase === 'idle' ? '영어로 옮기기' : '다시 옮기기' }}
          </button>

          <div v-if="translate.phase === 'streaming'" class="progress translate-progress" aria-live="polite">
            <div class="progress-row">
              <span class="spinner" aria-hidden="true"/>
              <span class="progress-status">{{ translate.status || '영어로 옮기고 있어요' }}</span>
            </div>
            <div class="progress-row sub">
              <span class="subtle small num">{{ formatCount(translate.text.length) }}자</span>
              <button class="btn btn-secondary btn-sm" type="button" @click="stopStreaming">멈추기</button>
            </div>
          </div>

          <div v-if="translate.text" class="result translation translate-result">
            <div class="result-head">
              <span class="result-title">{{ translate.done ? translate.done.title : '영어판' }}</span>
              <span v-if="translate.cost !== null" class="badge num">{{ formatUsd(translate.cost) }}</span>
            </div>
            <p v-if="translate.done && translate.done.summary" class="small muted">{{ translate.done.summary }}</p>
            <div ref="translation" class="result-text scroll">{{ translate.text }}</div>
            <div v-if="translate.phase === 'done' && translate.done" class="result-actions">
              <button class="btn btn-sm" type="button" :disabled="translate.isSaving || !!translate.created" @click="createEnglishDraft">
                <app-icon name="file-text" :size="14"/>{{ translate.isSaving ? '만드는 중…' : '영어판 임시저장 만들기' }}
              </button>
            </div>
            <p v-if="translate.created" class="created small">
              <app-icon name="check-circle" :size="14"/>영어판을 임시저장했어요.
              <a :href="translate.created" target="_blank" rel="noopener">열어 보기</a>
            </p>
          </div>

          <div v-if="translate.phase === 'stopped'" class="notice subtle-notice">
            <app-icon name="info" :size="18"/>
            <p>멈췄어요. 다시 옮기려면 위 버튼을 눌러 주세요.</p>
          </div>
          <ai-error-box v-if="translate.error" :message="translate.error" :code="translate.errorCode"/>
        </section>
      </div>

      <footer class="panel-foot">
        <div class="usage">
          <span class="num">이번 달 {{ formatUsd(settings.usage.costUsd) }} / {{ formatUsd(settings.monthlyLimitUsd) }}</span>
          <div class="usage-bar" aria-hidden="true">
            <span :class="{ warn: usageRatio >= 0.8 }" :style="{ width: `${Math.round(usageRatio * 100)}%` }"/>
          </div>
        </div>
        <a class="foot-link small" href="/setting#ai" target="_blank" rel="noopener">설정</a>
      </footer>
    </template>
  </aside>
</template>

<script lang="ts">
import { defineComponent, markRaw, PropType } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import AiErrorBox from '@/components/ai/AiErrorBox.vue';
import { AiMetaField, AiWriteBridge, normalizePostUrl } from '@/components/ai/aiWriteBridge';
import { EditorSelection } from '@/components/posts/editorSelection';
import {
  generateAiCover,
  generateAiMeta,
  getAiSettings,
  streamAiDraft,
  streamAiRewrite,
  streamAiTranslate,
} from '@/api/ai';
import { createPost } from '@/api/blog';
import {
  AI_DRAFT_LENGTHS,
  AI_ERROR,
  AI_REWRITE_INSTRUCTIONS,
  AiCoverDto,
  AiDoneEventDto,
  AiDraftLength,
  AiMetaDto,
  AiRewriteInstruction,
  AiSettingsDto,
  AiSourceDto,
  AiTranslateDoneEventDto,
} from '@/api/models/ai.dtos';
import { TagDto } from '@/api/models/blog.dtos';
import { attachmentFileBaseUrl, HttpApiError } from '@/api/common/httpApiClient';
import { errorCodeOf, SseStream } from '@/api/common/sseClient';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatCount, formatUsd, withObjectParticle } from '@/utils/format';

type PanelTab = 'draft' | 'rewrite' | 'meta' | 'translate';
type StepState = 'done' | 'failed' | 'skipped';

interface DraftStep {
  key: string;
  state: StepState;
  message: string;
}

// 스트리밍 본문을 에디터에 넣는 간격 (매 조각마다 넣으면 미리보기가 너무 자주 다시 그려진다)
const STREAM_FLUSH_MS = 120;
// 좁은 화면 (패널이 아래 시트가 되는 폭)
const SHEET_MEDIA = '(max-width: 900px)';

const META_LABELS: Record<AiMetaField, string> = {
  title: '제목',
  summary: '요약',
  tags: '태그',
  postUrl: '주소',
};

function emptyDraftState() {
  return {
    request: '',
    notes: '',
    length: 'medium' as AiDraftLength,
    webResearch: true,
    fillMeta: true,
    addCover: true,
    phase: 'idle' as 'idle' | 'streaming' | 'finishing' | 'done' | 'stopped' | 'error',
    status: '',
    text: '',
    chars: 0,
    cost: null as number | null,
    sources: [] as Array<AiSourceDto>,
    steps: [] as Array<DraftStep>,
    madeDraft: false,
    error: '',
    errorCode: '',
  };
}

export default defineComponent({
  name: 'AiWritePanel',
  components: { AppIcon, AiErrorBox },
  props: {
    bridge: {
      type: Object as PropType<AiWriteBridge>,
      required: true,
    },
    // 에디터에서 지금 고른 텍스트 (다듬기 미리보기)
    selectedText: {
      type: String,
      default: '',
    },
  },
  emits: ['close'],
  data() {
    return {
      settings: null as AiSettingsDto | null,
      settingsState: 'loading' as 'loading' | 'ready' | 'error',
      settingsError: '',
      tab: 'draft' as PanelTab,
      tabs: [
        { key: 'draft', label: '초안 쓰기' },
        { key: 'rewrite', label: '다듬기' },
        { key: 'meta', label: '정리' },
        { key: 'translate', label: '영어판' },
      ] as Array<{ key: PanelTab; label: string }>,
      lengths: AI_DRAFT_LENGTHS,
      rewriteOptions: AI_REWRITE_INSTRUCTIONS,
      isCollapsed: false,
      // 지금 돌고 있는 스트림 (멈추기용)
      stream: null as SseStream | null,
      flushTimer: null as ReturnType<typeof setTimeout> | null,
      draft: emptyDraftState(),
      rewrite: {
        phase: 'idle' as 'idle' | 'streaming' | 'done' | 'stopped' | 'error',
        selection: null as EditorSelection | null,
        instruction: 'polish' as AiRewriteInstruction,
        custom: '',
        lastCustom: '',
        label: '',
        status: '',
        result: '',
        cost: null as number | null,
        error: '',
        errorCode: '',
      },
      meta: {
        phase: 'idle' as 'idle' | 'loading' | 'done',
        result: null as AiMetaDto | null,
        filled: [] as Array<AiMetaField>,
        // 바꾸기를 누르면 다시 그리도록
        version: 0,
        error: '',
        errorCode: '',
      },
      cover: {
        phase: 'idle' as 'idle' | 'loading' | 'done',
        result: null as AiCoverDto | null,
        error: '',
        errorCode: '',
      },
      translate: {
        phase: 'idle' as 'idle' | 'streaming' | 'done' | 'stopped' | 'error',
        status: '',
        text: '',
        done: null as AiTranslateDoneEventDto | null,
        cost: null as number | null,
        isSaving: false,
        created: '',
        error: '',
        errorCode: '',
      },
    };
  },
  computed: {
    isStreaming(): boolean {
      return this.draft.phase === 'streaming' || this.rewrite.phase === 'streaming' || this.translate.phase === 'streaming';
    },
    // 한 번에 하나만 (편집기를 같이 건드리지 않게, 분당 요청 수도 아끼게)
    isBusy(): boolean {
      return this.isStreaming || this.draft.phase === 'finishing' || this.meta.phase === 'loading' || this.cover.phase === 'loading';
    },
    // 접힌 시트 머리에 보여 줄 진행 상황
    activeStatus(): string {
      if (this.draft.phase === 'streaming' || this.draft.phase === 'finishing') return this.draft.status || '초안을 쓰고 있어요';
      if (this.rewrite.phase === 'streaming') return '다듬고 있어요';
      if (this.translate.phase === 'streaming') return this.translate.status || '영어로 옮기고 있어요';
      if (this.meta.phase === 'loading') return '제목·요약·태그를 고르고 있어요';
      if (this.cover.phase === 'loading') return '커버 이미지를 그리고 있어요';
      return '';
    },
    modelLabel(): string {
      const settings = this.settings;
      if (!settings?.configured) {
        return '';
      }
      const model = settings.models?.find((item) => item.id === settings.model);
      return (model?.label ?? settings.model ?? '').replace(/^Claude\s+/, '');
    },
    usageRatio(): number {
      if (!this.settings || this.settings.monthlyLimitUsd <= 0) {
        return 0;
      }
      return Math.min(1, this.settings.usage.costUsd / this.settings.monthlyLimitUsd);
    },
    styleHint(): string {
      const style = this.settings?.style;
      if (style?.analyzed) {
        return `내 글 ${style.postCount}개에서 익힌 문체로 써요.`;
      }
      return '내 글이 2개 이상이면 먼저 문체를 익히고 그 말투로 써요.';
    },
    // 다듬기: 결과가 있으면 그때 잡아 둔 원래 글, 아니면 지금 고른 부분
    selectionPreview(): string {
      if (this.rewrite.phase !== 'idle' && this.rewrite.selection) {
        return this.rewrite.selection.text;
      }
      return this.selectedText.trim() ? this.selectedText : '';
    },
    metaRows(): Array<{ field: AiMetaField; label: string; value: string; same: boolean; filled: boolean; canApply: boolean }> {
      const result = this.meta.result;
      // version 은 [바꾸기] 뒤에 같음 여부를 다시 계산하게 하는 용도
      if (!result || this.meta.version < 0) {
        return [];
      }
      return (['title', 'summary', 'tags', 'postUrl'] as Array<AiMetaField>)
      .filter((field) => (field === 'tags' ? (result.tags ?? []).length > 0 : !!result[field]))
      .filter((field) => field !== 'postUrl' || this.bridge.isNewPost)
      .map((field) => ({
        field,
        label: META_LABELS[field],
        value: field === 'tags' ? (result.tags ?? []).join(', ') : field === 'postUrl' ? normalizePostUrl(result.postUrl) : result[field],
        same: this.bridge.isMetaFieldSameAs(field, result),
        filled: this.meta.filled.includes(field),
        canApply: true,
      }));
    },
    coverImageUrl(): string {
      return this.cover.result ? `${attachmentFileBaseUrl}${this.cover.result.url}` : '';
    },
  },
  watch: {
    // 탭마다 처음부터 보이게 (패널 본문 스크롤을 탭들이 같이 쓴다)
    tab() {
      const body = this.$refs['body'] as HTMLElement | undefined;
      if (body) {
        body.scrollTop = 0;
      }
    },
  },
  methods: {
    formatCount,
    formatUsd,
    hostOf(url: string): string {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch (e) {
        return '';
      }
    },
    async loadSettings(quiet = false) {
      if (!quiet) {
        this.settingsState = 'loading';
      }
      await getAiSettings()
      .then((settings) => {
        this.settings = settings;
        this.settingsState = 'ready';
      })
      .catch((error: HttpApiError) => {
        if (!quiet) {
          this.settingsError = error.serverErrorMessage || 'AI 설정을 불러오지 못했어요. 잠시 뒤 다시 해 주세요.';
          this.settingsState = 'error';
        }
      });
    },
    // 오류를 화면에 맞게 정리 (키가 지워졌으면 설정을 다시 받아 안내 화면으로)
    describeError(error: HttpApiError): { message: string; code: string } {
      const code = errorCodeOf(error);
      if (code === AI_ERROR.NO_KEY || code === AI_ERROR.DISABLED) {
        this.loadSettings(true);
      }
      return { message: error.getErrorMessage(), code };
    },
    stopStreaming() {
      this.stream?.abort();
    },
    isSheetLayout(): boolean {
      return window.matchMedia?.(SHEET_MEDIA).matches ?? false;
    },
    // 접기는 좁은 화면(아래 시트)에서만. 펼칠 때 진행 중인 작업이 있으면 그 카드를 보여 준다.
    toggleCollapse() {
      this.isCollapsed = this.isSheetLayout() ? !this.isCollapsed : false;
      if (!this.isCollapsed && (this.draft.phase === 'streaming' || this.draft.phase === 'finishing')) {
        this.revealInPanel('.draft-progress');
      }
    },
    // 패널 안에서 진행·결과 카드가 보이도록 스크롤한다
    revealInPanel(selector: string) {
      this.$nextTick(() => {
        const element = (this.$el as HTMLElement | undefined)?.querySelector?.(selector);
        element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    },
    // 스트리밍 본문을 모아서 에디터에 넣는다
    scheduleFlush(flush: () => void) {
      if (this.flushTimer) {
        return;
      }
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        flush();
      }, STREAM_FLUSH_MS);
    },
    cancelFlush() {
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }
    },

    // ---- 초안 쓰기 ----
    async startDraft() {
      const request = this.draft.request.trim();
      if (!request || this.isBusy) {
        return;
      }
      let mode: 'replace' | 'append' = 'replace';
      if (this.bridge.hasContent()) {
        const replace = await confirmDialog({
          title: '지금 쓴 글은 어떻게 할까요?',
          message: '에디터에 이미 글이 있어요. 초안으로 바꾸거나, 지금 글 아래에 이어 쓸 수 있어요.',
          confirmLabel: '초안으로 바꾸기',
          cancelLabel: '아래에 이어 쓰기',
        });
        mode = replace ? 'replace' : 'append';
      }

      const keep = this.draft;
      this.draft = {
        ...emptyDraftState(),
        request: keep.request,
        notes: keep.notes,
        length: keep.length,
        webResearch: keep.webResearch,
        fillMeta: keep.fillMeta,
        addCover: keep.addCover,
        phase: 'streaming',
      };
      // 좁은 화면에서는 시트를 접어 에디터에 글이 차오르는 걸 보여 준다.
      if (this.isSheetLayout()) {
        this.isCollapsed = true;
      } else {
        this.revealInPanel('.draft-progress');
      }
      this.bridge.beginStream(mode);

      let done: AiDoneEventDto | null = null;
      let failure: HttpApiError | null = null;
      const stream = markRaw(streamAiDraft({
        request,
        notes: this.draft.notes.trim() || undefined,
        length: this.draft.length,
        webResearch: this.draft.webResearch,
      }, {
        onStatus: (message) => {
          this.draft.status = message;
        },
        onDelta: (text) => {
          this.draft.text += text;
          this.draft.chars = this.draft.text.length;
          this.scheduleFlush(() => this.bridge.updateStream(this.draft.text));
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
      this.cancelFlush();
      this.bridge.updateStream(this.draft.text);
      this.bridge.endStream();

      if (failure) {
        const { message, code } = this.describeError(failure);
        this.draft.phase = 'error';
        this.draft.error = this.draft.text ? `${message} 여기까지 쓴 글은 에디터에 남겨 두었어요.` : message;
        this.draft.errorCode = code;
        this.isCollapsed = false;
        this.loadSettings(true);
        return;
      }
      if (!done) {
        this.draft.phase = 'stopped';
        this.isCollapsed = false;
        this.loadSettings(true);
        return;
      }
      await this.finishDraft(done);
    },
    async finishDraft(done: AiDoneEventDto) {
      this.draft.phase = 'finishing';
      this.draft.sources = done.sources ?? [];
      this.draft.cost = done.usage?.costUsd ?? null;
      this.draft.madeDraft = this.bridge.markAsDraft();
      const steps: Array<DraftStep> = [];

      if (this.draft.fillMeta) {
        this.draft.status = '제목·요약·태그를 고르고 있어요';
        const snapshot = this.bridge.snapshot();
        await generateAiMeta({ title: snapshot.title || undefined, content: snapshot.content })
        .then((meta) => {
          const filled = this.bridge.fillEmptyMeta(meta);
          this.meta.result = meta;
          this.meta.filled = filled;
          this.meta.phase = 'done';
          steps.push({
            key: 'meta',
            state: 'done',
            message: filled.length > 0
                ? `${withObjectParticle(filled.map((field) => META_LABELS[field]).join('·'))} 채웠어요`
                : '비어 있는 칸이 없어 그대로 두었어요. 정리 탭에서 바꿀 수 있어요',
          });
        })
        .catch((error: HttpApiError) => {
          steps.push({ key: 'meta', state: 'failed', message: `제목·요약·태그를 못 채웠어요. ${error.getErrorMessage()}` });
        });
      }

      if (this.draft.addCover) {
        const snapshot = this.bridge.snapshot();
        if (!snapshot.title) {
          steps.push({ key: 'cover', state: 'skipped', message: '제목이 없어 커버는 그리지 않았어요. 제목을 쓰고 정리 탭에서 만들어 주세요' });
        } else {
          this.draft.status = '커버 이미지를 그리고 있어요';
          await generateAiCover({ title: snapshot.title, summary: snapshot.summary, tags: snapshot.tags })
          .then((cover) => {
            this.bridge.applyCover(cover, snapshot.title);
            this.cover.result = cover;
            this.cover.phase = 'done';
            steps.push({ key: 'cover', state: 'done', message: '커버 이미지를 글 맨 위에 넣었어요' });
          })
          .catch((error: HttpApiError) => {
            steps.push({ key: 'cover', state: 'failed', message: `커버를 못 그렸어요. ${error.getErrorMessage()}` });
          });
        }
      }

      this.draft.steps = steps;
      this.draft.phase = 'done';
      this.draft.status = '';
      this.isCollapsed = false;
      this.revealInPanel('.draft-result');
      const cost = this.draft.cost !== null ? ` 이번 초안에 ${formatUsd(this.draft.cost)} 들었어요.` : '';
      const review = this.draft.madeDraft ? ' 임시저장으로 해 두었으니 읽어 보고 직접 공개해 주세요.' : ' 읽어 보고 다듬어 주세요.';
      toast.success(`초안을 다 썼어요.${cost}${review}`, 6000);
      if (done.stopReason === 'max_tokens') {
        toast.info('글이 길어서 끝까지 쓰지 못했어요. 마지막 부분을 확인해 주세요.', 6000);
      }
      this.loadSettings(true);
    },

    // ---- 다듬기 ----
    async startRewrite(instruction: AiRewriteInstruction, selection: EditorSelection | null = null) {
      if (this.isBusy) {
        return;
      }
      if (instruction === 'custom' && !this.rewrite.custom.trim() && !selection) {
        return;
      }
      const target = selection ?? this.bridge.captureSelection();
      if (!target) {
        this.rewrite.error = '에디터에서 다듬을 부분을 먼저 골라 주세요.';
        this.rewrite.errorCode = '';
        return;
      }
      const custom = instruction === 'custom' ? (selection ? this.rewrite.lastCustom : this.rewrite.custom.trim()) : '';
      Object.assign(this.rewrite, {
        phase: 'streaming',
        selection: markRaw(target),
        instruction,
        lastCustom: custom,
        label: instruction === 'custom' ? '직접' : (this.rewriteOptions.find((item) => item.value === instruction)?.label ?? ''),
        status: '',
        result: '',
        cost: null,
        error: '',
        errorCode: '',
      });
      if (instruction === 'custom') {
        this.rewrite.custom = '';
      }
      this.revealInPanel('.rewrite-result');

      let done: AiDoneEventDto | null = null;
      let failure: HttpApiError | null = null;
      const stream = markRaw(streamAiRewrite({
        text: target.text,
        instruction,
        customInstruction: custom || undefined,
        context: target.context || undefined,
      }, {
        onStatus: (message) => {
          this.rewrite.status = message;
        },
        onDelta: (text) => {
          this.rewrite.result += text;
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
        const { message, code } = this.describeError(failure);
        this.rewrite.phase = this.rewrite.result ? 'stopped' : 'error';
        this.rewrite.error = message;
        this.rewrite.errorCode = code;
      } else if (!done) {
        this.rewrite.phase = 'stopped';
      } else {
        this.rewrite.phase = 'done';
        this.rewrite.cost = (done as AiDoneEventDto).usage?.costUsd ?? null;
      }
      // 받은 글자가 없으면 결과 칸 없이 (오류가 있으면 오류만) 보여 준다
      if (!this.rewrite.result) {
        this.rewrite.phase = 'idle';
        this.rewrite.selection = null;
      }
      this.loadSettings(true);
    },
    regenerateRewrite() {
      if (this.rewrite.selection) {
        this.startRewrite(this.rewrite.instruction, this.rewrite.selection);
      }
    },
    applyRewrite() {
      const selection = this.rewrite.selection;
      if (!selection || !this.rewrite.result.trim()) {
        return;
      }
      // 고른 부분 앞뒤의 공백·줄바꿈은 그대로 둔다
      const leading = /^\s*/.exec(selection.text)?.[0] ?? '';
      const trailing = /\s*$/.exec(selection.text)?.[0] ?? '';
      const replaced = this.bridge.replaceSelection(selection, `${leading}${this.rewrite.result.trim()}${trailing}`);
      if (!replaced) {
        toast.error('고른 부분이 그사이 바뀌었어요. 다시 골라 주세요.');
        return;
      }
      toast.success('고른 부분을 바꿨어요.');
      this.resetRewrite();
    },
    resetRewrite() {
      Object.assign(this.rewrite, {
        phase: 'idle',
        selection: null,
        label: '',
        status: '',
        result: '',
        cost: null,
        error: '',
        errorCode: '',
      });
    },

    // ---- 정리 ----
    async runMeta() {
      if (this.isBusy) {
        return;
      }
      const snapshot = this.bridge.snapshot();
      if (!snapshot.content.trim()) {
        this.meta.error = '본문을 먼저 써 주세요. 글을 읽고 골라 드려요.';
        this.meta.errorCode = '';
        return;
      }
      this.meta.phase = 'loading';
      this.meta.error = '';
      await generateAiMeta({ title: snapshot.title || undefined, content: snapshot.content })
      .then((meta) => {
        this.meta.filled = this.bridge.fillEmptyMeta(meta);
        this.meta.result = meta;
        this.meta.phase = 'done';
        if (this.meta.filled.length > 0) {
          toast.success(`${withObjectParticle(this.meta.filled.map((field) => META_LABELS[field]).join('·'))} 채웠어요.`);
        }
      })
      .catch((error: HttpApiError) => {
        const { message, code } = this.describeError(error);
        this.meta.error = message;
        this.meta.errorCode = code;
        this.meta.phase = this.meta.result ? 'done' : 'idle';
      });
      this.loadSettings(true);
    },
    applyMetaRow(field: AiMetaField) {
      if (!this.meta.result) {
        return;
      }
      this.bridge.applyMetaField(field, this.meta.result);
      this.meta.version += 1;
    },
    async runCover() {
      if (this.isBusy) {
        return;
      }
      const snapshot = this.bridge.snapshot();
      if (!snapshot.title) {
        this.cover.error = '제목이 있어야 커버를 그릴 수 있어요. 제목을 먼저 써 주세요.';
        this.cover.errorCode = '';
        return;
      }
      this.cover.phase = 'loading';
      this.cover.error = '';
      await generateAiCover({ title: snapshot.title, summary: snapshot.summary, tags: snapshot.tags })
      .then((cover) => {
        this.bridge.applyCover(cover, snapshot.title);
        this.cover.result = cover;
        this.cover.phase = 'done';
        toast.success('커버 이미지를 글 맨 위에 넣었어요.');
      })
      .catch((error: HttpApiError) => {
        const { message, code } = this.describeError(error);
        this.cover.error = message;
        this.cover.errorCode = code;
        this.cover.phase = this.cover.result ? 'done' : 'idle';
      });
      this.loadSettings(true);
    },

    // ---- 영어판 ----
    async startTranslate() {
      if (this.isBusy) {
        return;
      }
      const snapshot = this.bridge.snapshot();
      if (!snapshot.content.trim()) {
        this.translate.error = '옮길 본문이 없어요. 글을 먼저 써 주세요.';
        this.translate.errorCode = '';
        return;
      }
      Object.assign(this.translate, {
        phase: 'streaming',
        status: '',
        text: '',
        done: null,
        cost: null,
        created: '',
        error: '',
        errorCode: '',
      });
      this.revealInPanel('.translate-progress');

      let done: AiTranslateDoneEventDto | null = null;
      let failure: HttpApiError | null = null;
      const stream = markRaw(streamAiTranslate({
        title: snapshot.title,
        summary: snapshot.summary,
        content: snapshot.content,
      }, {
        onStatus: (message) => {
          this.translate.status = message;
        },
        onDelta: (text) => {
          this.translate.text += text;
          this.scheduleFlush(() => this.followTranslation());
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
      this.cancelFlush();

      if (failure) {
        const { message, code } = this.describeError(failure);
        this.translate.phase = 'error';
        this.translate.error = message;
        this.translate.errorCode = code;
      } else if (!done) {
        this.translate.phase = 'stopped';
      } else {
        const event = done as AiTranslateDoneEventDto;
        this.translate.done = markRaw(event);
        this.translate.cost = event.usage?.costUsd ?? null;
        this.translate.phase = 'done';
        this.revealInPanel('.translate-result .result-actions');
      }
      this.loadSettings(true);
    },
    followTranslation() {
      const box = this.$refs['translation'] as HTMLElement | undefined;
      if (box) {
        box.scrollTop = box.scrollHeight;
      }
    },
    async createEnglishDraft() {
      const done = this.translate.done;
      if (!done || this.translate.isSaving) {
        return;
      }
      this.translate.isSaving = true;
      const snapshot = this.bridge.snapshot();
      const base = normalizePostUrl(snapshot.postUrl) || normalizePostUrl(done.title);
      const content = this.translate.text.trim();
      const tags = Array.from(new Set([...snapshot.tags, 'English']));
      await createPost({
        postUrl: base ? `${base}-en` : null,
        title: (done.title || snapshot.title).trim(),
        summary: (done.summary ?? '').substring(0, 255) || undefined,
        content,
        openType: 'DRAFT',
        thumbnailFileId: await this.bridge.resolveThumbnailFileId(content),
        tags: tags.map((name) => ({ name } as TagDto)),
        seriesUrl: null,
      })
      .then((post) => {
        const href = `${window.location.origin}/${post.author.blogId}/posts/${post.postUrl}`;
        this.translate.created = href;
        toast.success('영어판을 임시저장했어요.', { duration: 8000, link: { label: '열어 보기', href } });
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.translate.isSaving = false;
      });
    },
  },
  created() {
    this.loadSettings();
  },
  beforeUnmount() {
    this.cancelFlush();
    if (this.stream) {
      this.stream.abort();
      if (this.draft.phase === 'streaming') {
        this.bridge.updateStream(this.draft.text);
        this.bridge.endStream();
      }
    }
  },
});
</script>

<style scoped>
.ai-write-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  min-height: 0;
  height: 100%;
  background: var(--surface);
  border-left: 1px solid var(--border);
  box-sizing: border-box;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-3) var(--s-3) var(--s-4);
  border-bottom: 1px solid var(--border);
}

.head-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--s-2);
  text-align: left;
  cursor: default;
  color: var(--text);
}

.head-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-text);
}

.head-text {
  min-width: 0;
  display: grid;
  line-height: 1.3;
}

.head-name {
  font-weight: 700;
}

.head-model,
.head-status {
  font-size: var(--text-xs);
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.head-status {
  color: var(--accent-text);
}

/* 넓은 화면에서는 접기 없음 */
.collapse-icon {
  display: none;
  color: var(--text-3);
  flex-shrink: 0;
}

.panel-tabs {
  padding: 0 var(--s-2);
}

.panel-tabs button {
  padding: 10px 10px;
  font-size: var(--text-sm);
}

.panel-body {
  min-height: 0;
  overflow-y: auto;
  padding: var(--s-4);
  display: grid;
  align-content: start;
  gap: var(--s-4);
  overscroll-behavior: contain;
}

.tab-pane {
  display: grid;
  gap: var(--s-4);
  align-content: start;
  min-width: 0;
}

.panel-body .textarea {
  font-size: var(--text-sm);
  min-height: 0;
}

.optional {
  font-weight: 500;
  color: var(--text-3);
  font-size: var(--text-xs);
  margin-left: 4px;
}

/* 길이 고르기 */
.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.segmented button {
  height: 32px;
  border-radius: calc(var(--radius-sm) - 2px);
  color: var(--text-2);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: background-color var(--ease), color var(--ease), box-shadow var(--ease);
}

.segmented button.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.segmented button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggles {
  display: grid;
  gap: var(--s-3);
}

.toggles .check {
  font-size: var(--text-sm);
  color: var(--text);
}

.check-hint {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-3);
}

.style-hint {
  margin-top: calc(-1 * var(--s-2));
  text-align: center;
  font-size: var(--text-xs);
  color: var(--text-3);
}

/* 진행 상황 */
.progress {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border-radius: var(--radius);
  background: var(--accent-soft);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}

.progress-row.sub {
  justify-content: space-between;
}

.progress-status {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent-text);
  overflow-wrap: anywhere;
}

.spinner {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent);
  animation: ai-spin 0.8s linear infinite;
}

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 결과 */
.result {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  min-width: 0;
}

.result-head {
  display: flex;
  align-items: flex-start;
  gap: var(--s-2);
}

.result-head > .app-icon,
.result-head > .spinner {
  margin-top: 2px;
}

.result-head .badge {
  flex-shrink: 0;
}

.result-title {
  flex: 1;
  min-width: 0;
  font-weight: 700;
  font-size: var(--text-sm);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.result-head .ok {
  color: var(--success);
}

.result-text {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--text);
}

.result-text.scroll {
  max-height: 320px;
  overflow-y: auto;
  padding: var(--s-2) var(--s-3);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.steps {
  display: grid;
  gap: 6px;
  font-size: var(--text-sm);
  color: var(--text-2);
}

.steps li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px;
  align-items: start;
}

.steps li .app-icon {
  margin-top: 3px;
  color: var(--success);
}

.steps li.failed .app-icon {
  color: var(--danger);
}

.steps li.skipped .app-icon {
  color: var(--text-3);
}

.notice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-3);
  align-items: start;
  padding: var(--s-3) var(--s-4);
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--text-2);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.notice .app-icon {
  margin-top: 2px;
}

.notice .btn {
  margin-top: var(--s-2);
}

/* 키 없음 안내 */
.setup {
  display: grid;
  justify-items: start;
  gap: var(--s-2);
  line-height: 1.6;
}

.setup-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-text);
}

.setup-title {
  font-weight: 700;
  font-size: var(--text-md);
}

.setup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin-top: var(--s-2);
}

/* 출처 */
.sources {
  display: grid;
  gap: var(--s-2);
}

.sources-title,
.block-title {
  font-weight: 700;
  font-size: var(--text-sm);
}

.sources ol {
  display: grid;
  gap: 6px;
  counter-reset: source;
}

.sources li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: var(--s-2);
  font-size: var(--text-sm);
  counter-increment: source;
}

.sources li::before {
  content: counter(source);
  grid-row: span 2;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--surface-2);
  color: var(--text-3);
  font-size: var(--text-xs);
  font-weight: 700;
}

.sources a {
  overflow-wrap: anywhere;
  line-height: 1.45;
}

.source-host {
  font-size: var(--text-xs);
  color: var(--text-3);
}

/* 다듬기 */
.selection {
  display: grid;
  gap: 6px;
  padding: var(--s-3) var(--s-4);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

.selection.empty {
  border-left-color: var(--border-strong);
}

.selection-head {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-2);
}

.selection-text {
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.selection-text.placeholder {
  color: var(--text-3);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.custom-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-2);
  align-items: center;
}

.custom-row .input {
  font-size: var(--text-sm);
}

.custom-row .send {
  color: var(--accent-text);
}

/* 정리 */
.block {
  display: grid;
  gap: var(--s-3);
  padding-bottom: var(--s-4);
  border-bottom: 1px solid var(--border);
}

.block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.block .muted {
  line-height: 1.6;
}

.meta-list {
  display: grid;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.meta-list li {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: var(--s-2);
  align-items: start;
  padding: 10px var(--s-3);
  border-bottom: 1px solid var(--border);
  font-size: var(--text-sm);
}

.meta-list li:last-child {
  border-bottom: none;
}

.meta-label {
  color: var(--text-3);
  font-size: var(--text-xs);
  font-weight: 700;
  padding-top: 2px;
}

.meta-value {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  min-width: 0;
}

.meta-value.mono {
  font-size: var(--text-xs);
  padding-top: 2px;
}

.meta-action .btn {
  height: 26px;
  padding: 0 var(--s-2);
}

.applied {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--success);
  white-space: nowrap;
  padding-top: 3px;
}

.cover-preview {
  display: grid;
  gap: 6px;
  margin: 0;
}

.cover-preview img {
  width: 100%;
  aspect-ratio: 1200 / 630;
  object-fit: cover;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.created {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--success);
}

.created a {
  font-weight: 600;
}

.panel-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border-top: 1px solid var(--border);
  font-size: var(--text-xs);
  color: var(--text-3);
}

.usage {
  flex: 1;
  display: grid;
  gap: 4px;
  max-width: 220px;
}

.usage-bar {
  height: 4px;
  border-radius: var(--radius-pill);
  background: var(--surface-3);
  overflow: hidden;
}

.usage-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
}

.usage-bar span.warn {
  background: var(--warning);
}

.foot-link {
  color: var(--text-2);
}

.sk-line {
  height: 14px;
}

.sk-line.short {
  width: 60%;
}

.sk-block {
  height: 96px;
}

/* 좁은 화면: 아래에서 올라오는 시트 (접으면 머리만 남아 진행 상황과 멈추기만 보인다) */
@media (max-width: 900px) {
  .ai-write-panel {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    height: auto;
    max-height: min(72dvh, 680px);
    border-left: none;
    border-top: 1px solid var(--border);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    box-shadow: var(--shadow-lg);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .ai-write-panel.collapsed {
    grid-template-rows: auto;
  }

  .ai-write-panel.collapsed > :not(.panel-head) {
    display: none;
  }

  .ai-write-panel.collapsed .panel-head {
    border-bottom: none;
  }

  .head-title {
    cursor: pointer;
  }

  .collapse-icon {
    display: block;
  }
}
</style>
