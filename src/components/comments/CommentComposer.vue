<template>
  <div class="composer" :class="{ compact }">
    <span class="composer-avatar" :style="avatarStyle">
      <app-icon v-if="!isLoggedIn" name="user" :size="18"/>
    </span>
    <div class="composer-body">
      <textarea ref="textarea" class="textarea" v-model="content" :placeholder="placeholder" :rows="compact ? 2 : 3"
                @input="autoGrow" @keydown.ctrl.enter.prevent="submit" @keydown.meta.enter.prevent="submit"/>
      <div v-if="!isLoggedIn" class="guest-fields">
        <input class="input" type="text" v-model="name" placeholder="이름" maxlength="32" autocomplete="username"/>
        <input class="input" type="password" v-model="password" placeholder="비밀번호" autocomplete="new-password"/>
        <span class="hint">
          비밀번호는 이 댓글을 고치거나 지울 때 씁니다.
          <router-link :to="{ path: '/signin', query: { redirect: $route.fullPath } }">로그인</router-link>하면 입력하지 않아도 돼요.
        </span>
      </div>
      <div class="composer-actions">
        <span class="hint">마크다운을 쓸 수 있어요 · Ctrl+Enter 로 등록</span>
        <button v-if="cancelable" class="btn btn-ghost btn-sm" type="button" @click="$emit('cancel')">취소</button>
        <button class="btn btn-sm" type="button" :disabled="!isValid || isSubmitting" @click="submit">
          {{ submitLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import { attachmentFileBaseUrl } from '@/api/common/httpApiClient';
import AppIcon from '@/components/common/AppIcon.vue';

// eslint-disable-next-line no-unused-vars
export type CommentDoneCallback = (succeeded: boolean) => void;

export interface CommentSubmission {
  content: string;
  name: string;
  password: string;
}

// 댓글·답글 입력창. 로그인하지 않았으면 이름·비밀번호 칸을 함께 보여준다.
// submit 이벤트는 (입력값, 완료 콜백) 을 전달한다. 부모가 저장에 성공하면 콜백을 불러 입력창을 비운다.
export default defineComponent({
  name: 'CommentComposer',
  components: { AppIcon },
  props: {
    submitLabel: {
      type: String,
      default: '댓글 남기기',
    },
    placeholder: {
      type: String,
      default: '댓글을 남겨보세요',
    },
    compact: {
      type: Boolean,
      default: false,
    },
    cancelable: {
      type: Boolean,
      default: false,
    },
    autofocus: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['submit', 'cancel'],
  data() {
    return {
      content: '',
      name: '',
      password: '',
      isSubmitting: false,
    };
  },
  computed: {
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    isValid(): boolean {
      if (this.content.trim().length === 0) {
        return false;
      }
      return this.isLoggedIn || (this.name.trim().length > 0 && this.password.length > 0);
    },
    avatarStyle() {
      if (!this.isLoggedIn) {
        return {};
      }
      const profileImageUrl = store.state.accountStore.profileImageUrl;
      const url = profileImageUrl ? `${attachmentFileBaseUrl}${profileImageUrl}` : require('@/assets/profile.svg');
      return { backgroundImage: `url(${url})` };
    },
  },
  methods: {
    autoGrow() {
      const textarea = this.$refs['textarea'] as HTMLTextAreaElement | undefined;
      if (!textarea) {
        return;
      }
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
    },
    submit() {
      if (!this.isValid || this.isSubmitting) {
        return;
      }
      this.isSubmitting = true;
      const submission: CommentSubmission = {
        content: this.content.trim(),
        name: this.name.trim(),
        password: this.password,
      };
      this.$emit('submit', submission, (succeeded: boolean) => {
        this.isSubmitting = false;
        if (succeeded) {
          this.content = '';
          this.password = '';
          this.autoGrow();
        }
      });
    },
    focus() {
      (this.$refs['textarea'] as HTMLTextAreaElement | undefined)?.focus();
    },
  },
  mounted() {
    if (this.autofocus) {
      this.focus();
    }
  },
});
</script>

<style scoped>
.composer {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-3);
}

.composer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface-2) center / cover no-repeat;
  color: var(--text-3);
  display: grid;
  place-items: center;
  margin-top: 2px;
}

.compact .composer-avatar {
  width: 28px;
  height: 28px;
}

.composer-body {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}

.textarea {
  min-height: 0;
  resize: none;
  overflow: hidden;
  line-height: 1.6;
}

.guest-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-2);
}

.guest-fields .input {
  min-height: 38px;
  padding-block: 6px;
  font-size: var(--text-sm);
}

.guest-fields .hint {
  grid-column: 1 / -1;
}

.hint {
  font-size: var(--text-xs);
  color: var(--text-3);
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--s-2);
}

.composer-actions .hint {
  margin-right: auto;
}

@media (max-width: 500px) {
  .composer-actions .hint {
    display: none;
  }

  .guest-fields {
    grid-template-columns: 1fr;
  }
}
</style>
