<template>
  <!-- 토스트 -->
  <div class="toast-stack" aria-live="polite">
    <transition-group name="toast">
      <div v-for="item in state.toasts" :key="item.id" class="toast" :class="`toast-${item.kind}`" role="status">
        <app-icon :name="iconFor(item.kind)" :size="18"/>
        <span class="toast-message">{{ item.message }}</span>
        <button class="toast-close" type="button" aria-label="닫기" @click="dismiss(item.id)">
          <app-icon name="x" :size="16"/>
        </button>
      </div>
    </transition-group>
  </div>

  <!-- 확인 -->
  <transition name="modal">
    <div v-if="state.confirm" class="modal-backdrop" @click.self="confirm(false)">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-icon" :class="{ danger: state.confirm.danger }">
          <app-icon :name="state.confirm.danger ? 'alert' : 'info'" :size="22"/>
        </div>
        <h2 v-if="state.confirm.title" class="modal-title">{{ state.confirm.title }}</h2>
        <p class="modal-message">{{ state.confirm.message }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" type="button" @click="confirm(false)">
            {{ state.confirm.cancelLabel ?? '취소' }}
          </button>
          <button ref="confirm-button" class="btn" :class="{ 'btn-danger': state.confirm.danger }" type="button"
                  @click="confirm(true)">
            {{ state.confirm.confirmLabel ?? '확인' }}
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- 입력 -->
  <transition name="modal">
    <div v-if="state.prompt" class="modal-backdrop" @click.self="prompt(null)">
      <div class="modal" role="dialog" aria-modal="true">
        <h2 v-if="state.prompt.title" class="modal-title">{{ state.prompt.title }}</h2>
        <p v-if="state.prompt.message" class="modal-message">{{ state.prompt.message }}</p>
        <textarea v-if="state.prompt.multiline" ref="prompt-input" class="textarea" v-model="promptValue"
                  :placeholder="state.prompt.placeholder" rows="5"/>
        <input v-else ref="prompt-input" class="input" :type="state.prompt.type ?? 'text'" v-model="promptValue"
               :placeholder="state.prompt.placeholder" autocomplete="off" @keyup.enter="submitPrompt"/>
        <div class="modal-actions">
          <button class="btn btn-secondary" type="button" @click="prompt(null)">
            {{ state.prompt.cancelLabel ?? '취소' }}
          </button>
          <button class="btn" :class="{ 'btn-danger': state.prompt.danger }" type="button"
                  :disabled="!state.prompt.allowEmpty && promptValue.trim().length === 0" @click="submitPrompt">
            {{ state.prompt.confirmLabel ?? '확인' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import { dialogState, dismissToast, resolveConfirm, resolvePrompt, ToastKind } from '@/utils/dialog';

export default defineComponent({
  name: 'AppDialogHost',
  components: { AppIcon },
  data() {
    return {
      state: dialogState,
      promptValue: '',
    };
  },
  watch: {
    'state.prompt'(request) {
      if (request) {
        this.promptValue = request.defaultValue ?? '';
        nextTick(() => (this.$refs['prompt-input'] as HTMLInputElement | undefined)?.focus());
      }
    },
    'state.confirm'(request) {
      if (request) {
        nextTick(() => (this.$refs['confirm-button'] as HTMLButtonElement | undefined)?.focus());
      }
    },
  },
  methods: {
    iconFor(kind: ToastKind): string {
      if (kind === 'success') return 'check-circle';
      if (kind === 'error') return 'alert';
      return 'info';
    },
    dismiss(id: number) {
      dismissToast(id);
    },
    confirm(ok: boolean) {
      resolveConfirm(ok);
    },
    prompt(value: string | null) {
      resolvePrompt(value);
    },
    submitPrompt() {
      if (!this.state.prompt) {
        return;
      }
      if (!this.state.prompt.allowEmpty && this.promptValue.trim().length === 0) {
        return;
      }
      resolvePrompt(this.promptValue);
    },
    onKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (this.state.prompt) {
          resolvePrompt(null);
        } else if (this.state.confirm) {
          resolveConfirm(false);
        }
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
.toast-stack {
  position: fixed;
  left: 50%;
  bottom: calc(var(--s-6) + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-2);
  z-index: 1200;
  width: min(480px, calc(100% - 32px));
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  width: 100%;
  padding: 12px 12px 12px 14px;
  border-radius: var(--radius);
  background: var(--text);
  color: var(--bg);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.45;
}

.toast-success {
  color: #fff;
  background: var(--success);
}

.toast-error {
  color: #fff;
  background: var(--danger);
}

.toast-message {
  flex: 1;
  min-width: 0;
  word-break: keep-all;
}

.toast-close {
  color: inherit;
  opacity: 0.7;
  display: inline-flex;
  padding: 4px;
  border-radius: 50%;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: var(--s-4);
  background: var(--overlay);
  backdrop-filter: blur(2px);
}

.modal {
  width: min(420px, 100%);
  padding: var(--s-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: grid;
  gap: var(--s-3);
}

.modal-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-text);
}

.modal-icon.danger {
  background: var(--danger-soft);
  color: var(--danger);
}

.modal-title {
  font-size: var(--text-lg);
}

.modal-message {
  color: var(--text-2);
  white-space: pre-line;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--s-2);
  margin-top: var(--s-2);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(8px) scale(0.98);
}
</style>
