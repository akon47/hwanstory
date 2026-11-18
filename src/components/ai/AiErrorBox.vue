<template>
  <div class="ai-error" role="alert">
    <app-icon name="alert" :size="16"/>
    <div class="ai-error-body">
      <p>{{ message }}</p>
      <a v-if="settingsHint" class="ai-error-link" href="/setting#ai" target="_blank" rel="noopener">{{ settingsHint }}</a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { AI_ERROR } from '@/api/models/ai.dtos';

// AI 패널의 오류 한 줄. 서버가 준 message(해요체)를 그대로 보여 주고, 설정에서 풀 수 있는 오류면 설정 링크를 붙인다.
export default defineComponent({
  name: 'AiErrorBox',
  components: { AppIcon },
  props: {
    message: {
      type: String,
      required: true,
    },
    // 대문자 오류 코드 (AI_LIMIT_EXCEEDED 등)
    code: {
      type: String,
      default: '',
    },
    // 설정 화면 안에서 쓸 때는 설정 링크를 달지 않는다
    settingsLink: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    settingsHint(): string {
      if (!this.settingsLink) return '';
      if (this.code === AI_ERROR.LIMIT_EXCEEDED) return '설정에서 한도 바꾸기';
      if (this.code === AI_ERROR.NO_KEY || this.code === AI_ERROR.INVALID_KEY) return '설정에서 키 확인하기';
      return '';
    },
  },
});
</script>

<style scoped>
.ai-error {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-2);
  align-items: start;
  padding: var(--s-3);
  border-radius: var(--radius);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: var(--text-sm);
  line-height: 1.55;
}

.ai-error .app-icon {
  margin-top: 2px;
}

.ai-error-body {
  display: grid;
  gap: 4px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ai-error-link {
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
</style>
