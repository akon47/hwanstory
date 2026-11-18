<template>
  <section id="ai" ref="root" class="card ai-settings">
    <div class="card-head">
      <h2>AI 글쓰기</h2>
      <span v-if="settings && settings.available" class="badge" :class="{ 'badge-success': settings.configured }">
        <template v-if="settings.configured">연결됨 · <span class="mono">····{{ settings.keyLast4 }}</span></template>
        <template v-else>아직 키가 없어요</template>
      </span>
    </div>

    <div v-if="state === 'loading'" class="card-body loading">
      <div class="skeleton sk-line"/>
      <div class="skeleton sk-input"/>
      <div class="skeleton sk-input"/>
    </div>

    <div v-else-if="state === 'error'" class="card-body">
      <div class="notice">
        <app-icon name="alert" :size="18"/>
        <div>
          <p>{{ loadError }}</p>
          <button class="btn btn-secondary btn-sm" type="button" @click="load">다시 불러오기</button>
        </div>
      </div>
    </div>

    <div v-else-if="settings && !settings.available" class="card-body">
      <div class="notice">
        <app-icon name="info" :size="18"/>
        <p>지금은 AI 글쓰기를 쓸 수 없어요. 서버에서 기능이 꺼져 있어요.</p>
      </div>
    </div>

    <template v-else-if="settings">
      <div class="card-body ai-body">
        <p class="intro">
          내 Anthropic API 키로 글쓰기 화면에서 초안 쓰기, 문장 다듬기, 제목·요약·태그, 커버 이미지, 영어판을 쓸 수 있어요.
          비용은 내 Anthropic 계정으로 나가요.
        </p>

        <div class="field">
          <label for="ai-key">API 키</label>
          <input id="ai-key" class="input" :class="{ invalid: !!keyError }" type="password" v-model.trim="apiKey"
                 autocomplete="off" spellcheck="false" maxlength="300"
                 :placeholder="settings.configured ? '새 키로 바꿀 때만 넣어 주세요' : 'sk-ant-로 시작하는 키'"
                 @input="keyError = ''"/>
          <span v-if="keyError" class="error-text">{{ keyError }}</span>
          <span class="hint">console.anthropic.com 에서 만든 API 키를 넣어 주세요. 서버에 암호화해서 저장하고 다시 보여 주지 않아요.</span>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="ai-model">모델</label>
            <select id="ai-model" class="select" v-model="model">
              <option v-for="item in settings.models" :key="item.id" :value="item.id">{{ item.label }} · {{ item.description }}</option>
            </select>
            <span class="hint">{{ priceHint }}</span>
          </div>
          <div class="field">
            <label for="ai-limit">한 달 한도</label>
            <div class="input-with-prefix">
              <span class="prefix">$</span>
              <input id="ai-limit" class="input num" :class="{ invalid: !isLimitValid }" type="number" inputmode="decimal"
                     :min="limitMin" :max="limitMax" step="0.5" v-model.number="monthlyLimit"/>
            </div>
            <span v-if="!isLimitValid" class="error-text">{{ limitMin }}에서 {{ limitMax }} 사이로 넣어 주세요.</span>
            <span v-else class="hint">한도에 닿으면 다음 달까지 AI 를 쓰지 않아요.</span>
          </div>
        </div>

        <div class="usage">
          <div class="usage-head">
            <span class="section-title">{{ usageMonthLabel }} 사용</span>
            <span class="num"><b>{{ formatUsd(settings.usage.costUsd) }}</b> <span class="subtle">/ {{ formatUsd(settings.monthlyLimitUsd) }}</span></span>
          </div>
          <div class="usage-bar" role="progressbar" :aria-valuenow="Math.round(usageRatio * 100)" aria-valuemin="0" aria-valuemax="100"
               aria-label="이번 달 한도 대비 사용량">
            <span :class="{ warn: usageRatio >= 0.8 }" :style="{ width: `${Math.round(usageRatio * 100)}%` }"/>
          </div>
          <span class="hint num">요청 {{ formatCount(settings.usage.requests) }}번</span>
        </div>

        <div class="style">
          <div class="style-head">
            <div class="style-text">
              <div class="section-title">내 문체</div>
              <div class="muted small">{{ styleSummary }}</div>
            </div>
            <button class="btn btn-secondary btn-sm" type="button" :disabled="!settings.configured || isAnalyzing" @click="analyze">
              <app-icon name="sparkles" :size="14"/>{{ isAnalyzing ? '분석하고 있어요…' : settings.style.analyzed ? '다시 분석' : '분석하기' }}
            </button>
          </div>
          <p v-if="!settings.configured" class="hint">키를 넣으면 내 글로 문체를 익힐 수 있어요.</p>
          <p v-if="styleNote" class="style-note small">{{ styleNote }}</p>
          <template v-if="settings.style.profile">
            <button class="profile-toggle small" type="button" :aria-expanded="showProfile" @click="showProfile = !showProfile">
              문체 설명 {{ showProfile ? '접기' : '보기' }}<app-icon :name="showProfile ? 'chevron-up' : 'chevron-down'" :size="14"/>
            </button>
            <p v-if="showProfile" class="profile-text">{{ settings.style.profile }}</p>
          </template>
        </div>
      </div>

      <div class="card-foot">
        <button v-if="settings.configured" class="btn btn-danger-ghost btn-sm delete-key" type="button" :disabled="isSaving"
                @click="deleteKey">
          키 삭제
        </button>
        <span class="foot-spacer"/>
        <span v-if="isDirty" class="subtle small unsaved">저장하지 않은 변경이 있어요</span>
        <button class="btn" type="button" :disabled="!isDirty || !isLimitValid || isSaving" @click="save">
          {{ isSaving ? (apiKey ? '키를 확인하고 있어요…' : '저장하고 있어요…') : '저장' }}
        </button>
      </div>
    </template>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { analyzeAiStyle, deleteAiKey, getAiSettings, saveAiSettings } from '@/api/ai';
import { AI_ERROR, AI_MONTHLY_LIMIT_MAX, AI_MONTHLY_LIMIT_MIN, AiSettingsDto } from '@/api/models/ai.dtos';
import { HttpApiError } from '@/api/common/httpApiClient';
import { errorCodeOf } from '@/api/common/sseClient';
import { confirmDialog, toast } from '@/utils/dialog';
import { formatCount, formatRelativeDate, formatUsd } from '@/utils/format';

// 설정 화면의 "AI 글쓰기" 카드: 키 연결·모델·월 한도·이번 달 사용량·문체 분석
export default defineComponent({
  name: 'AiSettingsCard',
  components: { AppIcon },
  data() {
    return {
      state: 'loading' as 'loading' | 'ready' | 'error',
      loadError: '',
      settings: null as AiSettingsDto | null,
      apiKey: '',
      keyError: '',
      model: '',
      monthlyLimit: 10 as number | string,
      isSaving: false,
      isAnalyzing: false,
      styleNote: '',
      showProfile: false,
      limitMin: AI_MONTHLY_LIMIT_MIN,
      limitMax: AI_MONTHLY_LIMIT_MAX,
    };
  },
  computed: {
    limitValue(): number {
      return typeof this.monthlyLimit === 'number' ? this.monthlyLimit : Number(this.monthlyLimit);
    },
    isLimitValid(): boolean {
      return Number.isFinite(this.limitValue) && this.limitValue >= AI_MONTHLY_LIMIT_MIN && this.limitValue <= AI_MONTHLY_LIMIT_MAX;
    },
    isDirty(): boolean {
      if (!this.settings) {
        return false;
      }
      return this.apiKey.length > 0 || this.model !== this.settings.model || this.limitValue !== this.settings.monthlyLimitUsd;
    },
    priceHint(): string {
      const model = this.settings?.models?.find((item) => item.id === this.model);
      if (!model) {
        return '';
      }
      return `100만 토큰당 입력 ${formatUsd(model.inputPerMTok)} · 출력 ${formatUsd(model.outputPerMTok)}`;
    },
    usageRatio(): number {
      if (!this.settings || this.settings.monthlyLimitUsd <= 0) {
        return 0;
      }
      return Math.min(1, this.settings.usage.costUsd / this.settings.monthlyLimitUsd);
    },
    usageMonthLabel(): string {
      const month = Number((this.settings?.usage.month ?? '').split('-')[1]);
      return month ? `${month}월` : '이번 달';
    },
    styleSummary(): string {
      const style = this.settings?.style;
      if (!style?.analyzed) {
        return '아직 문체를 익히지 않았어요. 글이 2개 이상이면 내 말투를 익혀서 써요.';
      }
      const when = formatRelativeDate(style.analyzedAt);
      return `내 글 ${style.postCount}개로 문체를 익혔어요${when ? ` · ${when}` : ''}`;
    },
  },
  methods: {
    formatCount,
    formatUsd,
    apply(settings: AiSettingsDto) {
      this.settings = settings;
      this.model = settings.model;
      this.monthlyLimit = settings.monthlyLimitUsd;
      this.apiKey = '';
      this.keyError = '';
      this.state = 'ready';
    },
    async load() {
      this.state = 'loading';
      await getAiSettings()
      .then((settings) => {
        this.apply(settings);
        this.scrollIntoViewIfLinked();
      })
      .catch((error: HttpApiError) => {
        this.loadError = error.serverErrorMessage || 'AI 설정을 불러오지 못했어요. 잠시 뒤 다시 해 주세요.';
        this.state = 'error';
      });
    },
    // 글쓰기 화면의 "설정에서 키 넣기"(/setting#ai)로 왔으면 이 카드로 내려 준다
    scrollIntoViewIfLinked() {
      if (this.$route.hash !== '#ai') {
        return;
      }
      this.$nextTick(() => {
        (this.$refs['root'] as HTMLElement | undefined)?.scrollIntoView({ block: 'start' });
        if (this.settings && !this.settings.configured) {
          (document.getElementById('ai-key') as HTMLInputElement | null)?.focus({ preventScroll: true });
        }
      });
    },
    async save() {
      if (!this.settings || !this.isDirty || !this.isLimitValid || this.isSaving) {
        return;
      }
      const withKey = this.apiKey.length > 0;
      this.isSaving = true;
      await saveAiSettings({
        apiKey: withKey ? this.apiKey : null,
        model: this.model,
        monthlyLimitUsd: this.limitValue,
      })
      .then((settings) => {
        this.apply(settings);
        toast.success(withKey ? '키를 확인하고 저장했어요.' : 'AI 설정을 저장했어요.');
      })
      .catch((error: HttpApiError) => {
        if (errorCodeOf(error) === AI_ERROR.INVALID_KEY) {
          this.keyError = error.getErrorMessage();
        } else {
          toast.error(error.getErrorMessage());
        }
      })
      .finally(() => {
        this.isSaving = false;
      });
    },
    async deleteKey() {
      const ok = await confirmDialog({
        title: 'API 키를 지울까요?',
        message: '지워도 익힌 문체와 사용 기록은 남아요. 다시 쓰려면 키를 새로 넣어야 해요.',
        confirmLabel: '지우기',
        danger: true,
      });
      if (!ok) {
        return;
      }
      this.isSaving = true;
      await deleteAiKey()
      .then(async () => {
        toast.success('키를 지웠어요.');
        await this.load();
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isSaving = false;
      });
    },
    async analyze() {
      if (!this.settings || this.isAnalyzing) {
        return;
      }
      this.isAnalyzing = true;
      this.styleNote = '';
      await analyzeAiStyle()
      .then((style) => {
        if (this.settings) {
          this.settings = { ...this.settings, style };
        }
        toast.success(`내 글 ${style.postCount}개로 문체를 익혔어요.`);
      })
      .catch((error: HttpApiError) => {
        // 글이 모자란 건 오류라기보다 안내라 카드 안에 조용히 보여 준다.
        if (errorCodeOf(error) === AI_ERROR.NOT_ENOUGH_POSTS) {
          this.styleNote = error.getErrorMessage();
        } else {
          toast.error(error.getErrorMessage());
        }
      })
      .finally(() => {
        this.isAnalyzing = false;
      });
    },
  },
  created() {
    this.load();
  },
});
</script>

<style scoped>
.ai-settings {
  scroll-margin-top: calc(var(--header-height) + var(--s-4));
}

.ai-body {
  display: grid;
  gap: var(--s-5);
}

.intro {
  color: var(--text-2);
  line-height: 1.65;
}

.field-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: var(--s-4);
}

.field .hint {
  line-height: 1.5;
}

.section-title {
  font-weight: 700;
  font-size: var(--text-sm);
}

.usage {
  display: grid;
  gap: 6px;
  padding: var(--s-4);
  border-radius: var(--radius);
  background: var(--surface-2);
}

.usage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-3);
}

.usage-head b {
  font-size: var(--text-lg);
  font-weight: 800;
  letter-spacing: -0.01em;
}

.usage-bar {
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--surface-3);
  overflow: hidden;
}

.usage-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width var(--ease);
}

.usage-bar span.warn {
  background: var(--warning);
}

.usage .hint {
  font-size: var(--text-xs);
  color: var(--text-3);
}

.style {
  display: grid;
  gap: var(--s-2);
  padding-top: var(--s-5);
  border-top: 1px solid var(--border);
}

.style-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
}

.style-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.style .hint {
  font-size: var(--text-xs);
  color: var(--text-3);
}

.style-note {
  padding: var(--s-2) var(--s-3);
  border-radius: var(--radius-sm);
  background: var(--warning-soft);
  color: var(--text);
  line-height: 1.55;
}

.profile-toggle {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--accent-text);
  font-weight: 600;
}

.profile-text {
  padding: var(--s-3) var(--s-4);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text-2);
  font-size: var(--text-sm);
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.card-foot {
  align-items: center;
}

.foot-spacer {
  flex: 1;
}

.unsaved {
  align-self: center;
}

.notice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-3);
  align-items: start;
  color: var(--text-2);
  line-height: 1.6;
}

.notice .app-icon {
  margin-top: 3px;
}

.notice .btn {
  margin-top: var(--s-2);
}

.loading {
  display: grid;
  gap: var(--s-3);
}

.sk-line {
  height: 14px;
  width: 70%;
}

.sk-input {
  height: 42px;
}

@media (max-width: 640px) {
  .field-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .style-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-foot {
    flex-wrap: wrap;
  }
}
</style>
