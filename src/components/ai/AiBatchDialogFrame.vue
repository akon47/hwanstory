<template>
  <teleport to="body">
    <div class="bf-backdrop" @click.self="$emit('close')">
      <div class="bf-dialog" :style="{ '--bf-width': `${width}px` }" role="dialog" aria-modal="true" :aria-labelledby="titleId">
        <header class="bf-head">
          <div class="bf-head-text">
            <h2 :id="titleId">{{ title }}</h2>
            <p v-if="subtitle" class="small muted">{{ subtitle }}</p>
          </div>
          <button class="btn btn-icon btn-sm" type="button" aria-label="닫기" title="닫기" @click="$emit('close')">
            <app-icon name="x" :size="18"/>
          </button>
        </header>

        <div v-if="progress" class="bf-progress" aria-live="polite">
          <div class="bf-progress-row">
            <span v-if="progress.state === 'running'" class="bf-spinner" aria-hidden="true"/>
            <app-icon v-else-if="progress.state === 'done'" class="ok" name="check-circle" :size="16"/>
            <app-icon v-else class="note" name="info" :size="16"/>
            <span class="bf-status">{{ progress.text }}</span>
          </div>
          <div class="bf-bar" aria-hidden="true"><span :style="{ width: `${progress.percent}%` }"/></div>
          <div v-if="progress.detail" class="bf-detail small subtle num">{{ progress.detail }}</div>
        </div>

        <div ref="body" class="bf-body">
          <slot/>
        </div>

        <slot name="bottom"/>

        <footer class="bf-foot">
          <slot name="foot"/>
        </footer>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { dialogState } from '@/utils/dialog';
import { BatchProgress } from '@/components/ai/aiBatch';

let nextId = 1;

// AI 일괄 작업 창(커버 한꺼번에 만들기, 제목·요약·태그 한꺼번에 채우기)의 공통 틀.
// body 로 teleport 하고, 넓은 화면은 가운데 창, 640px 이하는 아래에서 올라오는 시트. 가운데 목록만 스크롤된다.
// 닫기(X·바깥 누르기·Esc)는 'close' 로만 알리고, 정말 닫을지는 쓰는 쪽이 정한다(진행 중이면 확인 등).
export default defineComponent({
  name: 'AiBatchDialogFrame',
  components: { AppIcon },
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    // 진행 상황 칸 (null 이면 안 보인다)
    progress: {
      type: Object as PropType<BatchProgress | null>,
      default: null,
    },
    // 넓은 화면에서의 최대 폭(px)
    width: {
      type: Number,
      default: 620,
    },
  },
  emits: ['close'],
  data() {
    return {
      titleId: `ai-batch-title-${nextId++}`,
    };
  },
  methods: {
    // 가운데 목록 (쓰는 쪽이 스크롤 위치를 다룰 때)
    bodyElement(): HTMLElement | undefined {
      return this.$refs['body'] as HTMLElement | undefined;
    },
    onKeydown(event: KeyboardEvent) {
      // 확인 창이 떠 있으면 그 창이 Esc 를 받는다
      if (event.key === 'Escape' && !dialogState.confirm) {
        this.$emit('close');
      }
    },
  },
  mounted() {
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
  },
});
</script>

<style scoped>
.bf-backdrop {
  position: fixed;
  inset: 0;
  /* 확인 창(1100)·토스트(1200)보다 아래 */
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: var(--s-4);
  background: var(--overlay);
  backdrop-filter: blur(2px);
}

.bf-dialog {
  width: min(var(--bf-width), 100%);
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

.bf-dialog > * {
  flex-shrink: 0;
}

.bf-dialog > .bf-body {
  flex: 1 1 auto;
}

.bf-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-5) var(--s-5) var(--s-3) var(--s-6);
}

.bf-head h2 {
  font-size: var(--text-lg);
}

.bf-head-text {
  display: grid;
  gap: 2px;
}

.bf-progress {
  display: grid;
  gap: 6px;
  margin: 0 var(--s-6) var(--s-3);
  padding: var(--s-3) var(--s-4);
  border-radius: var(--radius);
  background: var(--accent-soft);
}

.bf-progress-row {
  display: flex;
  align-items: flex-start;
  gap: var(--s-2);
}

.bf-progress-row .bf-spinner,
.bf-progress-row .app-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.bf-progress-row .ok {
  color: var(--success);
}

.bf-progress-row .note {
  color: var(--accent-text);
}

.bf-status {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent-text);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.bf-bar {
  height: 4px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  overflow: hidden;
}

.bf-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width var(--ease);
}

.bf-body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.bf-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-6) var(--s-4);
  border-top: 1px solid var(--border);
}

.bf-spinner {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent);
  animation: bf-spin 0.8s linear infinite;
}

@keyframes bf-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 좁은 화면: 아래에서 올라오는 전체 폭 시트 */
@media (max-width: 640px) {
  .bf-backdrop {
    padding: 0;
    place-items: end stretch;
  }

  .bf-dialog {
    width: 100%;
    max-height: 92dvh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    border-bottom: none;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .bf-head {
    padding: var(--s-4) var(--s-3) var(--s-3) var(--s-4);
  }

  .bf-progress {
    margin: 0 var(--s-4) var(--s-3);
  }

  .bf-foot {
    padding-left: var(--s-4);
    padding-right: var(--s-4);
  }
}
</style>
