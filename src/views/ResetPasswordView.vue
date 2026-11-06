<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="resetPassword">
      <div class="auth-icon"><app-icon name="lock" :size="22"/></div>
      <h1 class="auth-title">비밀번호 재설정</h1>
      <p class="auth-lead muted">새로 쓸 비밀번호를 입력하세요.</p>
      <div class="field">
        <label for="password">새 비밀번호</label>
        <input id="password" class="input" type="password" v-model="password" placeholder="새 비밀번호"
               autocomplete="new-password" autofocus/>
      </div>
      <div class="field">
        <label for="password-repeat">새 비밀번호 확인</label>
        <input id="password-repeat" class="input" :class="{ invalid: passwordRepeat && !isPasswordRepeatValid }"
               type="password" v-model="passwordRepeat" placeholder="한 번 더 입력" autocomplete="new-password"/>
        <span v-if="passwordRepeat && !isPasswordRepeatValid" class="error-text">비밀번호가 서로 다릅니다.</span>
      </div>
      <button class="btn btn-lg btn-block" type="submit" :disabled="!isPasswordValid || !isPasswordRepeatValid || isLoading">
        비밀번호 바꾸기
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { resetPassword } from '@/api/accounts';
import { HttpApiError } from '@/api/common/httpApiClient';
import AppIcon from '@/components/common/AppIcon.vue';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'ResetPasswordView',
  components: { AppIcon },
  props: {
    token: {
      type: String,
      require: true,
    },
  },
  data() {
    return {
      password: '',
      passwordRepeat: '',
      isLoading: false,
    };
  },
  computed: {
    isPasswordValid(): boolean {
      return this.password.length > 0;
    },
    isPasswordRepeatValid(): boolean {
      return this.password === this.passwordRepeat;
    },
  },
  methods: {
    async resetPassword() {
      if (!this.token || !this.isPasswordValid || !this.isPasswordRepeatValid) {
        return;
      }

      this.isLoading = true;
      await resetPassword({
        newPassword: this.password,
        resetPasswordToken: this.token,
      })
      .then(() => {
        toast.success('비밀번호를 바꿨습니다. 새 비밀번호로 로그인하세요.');
        this.$router.push('/signin');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
        this.$router.push('/');
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
  },
});
</script>

<style scoped>
.auth-page {
  display: grid;
  grid-template-columns: minmax(0, 420px);
  justify-content: center;
  align-content: start;
  padding: var(--s-12) var(--gutter) var(--s-16);
}

.auth-card {
  width: 100%;
  min-width: 0;
  display: grid;
  gap: var(--s-4);
  padding: var(--s-8);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.auth-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-text);
}

.auth-title {
  font-size: var(--text-2xl);
}

.auth-lead {
  margin-top: calc(var(--s-3) * -1);
}
</style>
