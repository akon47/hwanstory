<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="signIn">
      <router-link class="auth-logo" to="/" aria-label="Hwan'Story 홈">
        <img class="logo" src="@/assets/logo-title.svg" alt="Hwan'Story"/>
      </router-link>
      <h1 class="auth-title">로그인</h1>
      <p class="auth-lead muted">다시 만나서 반가워요.</p>

      <div class="field">
        <label for="email">이메일</label>
        <input id="email" class="input" :class="{ invalid: email && !isEmailValid }" type="email" v-model.trim="email"
               placeholder="you@example.com" autocomplete="email" inputmode="email" autofocus/>
      </div>
      <div class="field">
        <div class="label-row">
          <label for="password">비밀번호</label>
          <button class="link-button" type="button" :disabled="isLoading" @click="sendResetPasswordUrlToEmail">
            비밀번호를 잊으셨나요?
          </button>
        </div>
        <input id="password" class="input" type="password" v-model="password" placeholder="비밀번호"
               autocomplete="current-password"/>
      </div>

      <button class="btn btn-lg btn-block" type="submit" :disabled="!isEmailValid || !isPasswordValid || isLoading">
        {{ isLoading ? '로그인 중…' : '로그인' }}
      </button>

      <div class="or-separator"><span>또는 소셜 계정으로</span></div>
      <div class="social-row">
        <a v-for="social in socials" :key="social.id" class="social-button" :href="getSocialLoginUrl(social.id)"
           :title="`${social.label}로 로그인`" :aria-label="`${social.label}로 로그인`">
          <provider-button :provider="social.id"/>
        </a>
      </div>

      <p class="auth-foot muted">
        아직 계정이 없나요?
        <router-link to="/signup">회원가입</router-link>
      </p>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import { apiBaseUrl, HttpApiError } from '@/api/common/httpApiClient';
import ProviderButton from '@/components/common/ProviderButton.vue';
import { sendResetPasswordUrlToEmail } from '@/api/accounts';
import { toast } from '@/utils/dialog';

const SOCIALS = [
  { id: 'github', label: 'GitHub' },
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'naver', label: '네이버' },
  { id: 'kakao', label: '카카오' },
  { id: 'discord', label: 'Discord' },
  { id: 'microsoft', label: 'Microsoft' },
];

export default defineComponent({
  name: 'SigninForm',
  components: { ProviderButton },
  data() {
    return {
      email: '',
      password: '',
      socials: SOCIALS,
      isLoading: false,
    };
  },
  computed: {
    isEmailValid(): boolean {
      const regex =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(this.email);
    },
    isPasswordValid(): boolean {
      return this.password.length > 0;
    },
  },
  methods: {
    async signIn() {
      if (!this.isEmailValid || !this.isPasswordValid || this.isLoading) {
        return;
      }
      this.isLoading = true;
      await store.dispatch('accountStore/signIn', {
        email: this.email,
        password: this.password,
      })
      .then(() => {
        // 로그인이 필요한 화면(예: 기기 로그인 승인 /device?code=…)에서 왔다면 그곳으로 돌려보낸다. 사이트 내부 경로만 허용.
        const redirect = this.$route.query.redirect;
        const target = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
        this.$router.push(target);
      }).catch((error: HttpApiError) => {
        toast.error(error.isUnauthorized() ? '이메일 또는 비밀번호가 맞지 않습니다.' : error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    getSocialLoginUrl(registrationId: string) {
      return `${apiBaseUrl}v1/authentication/oauth2/${registrationId}?redirect_uri=${process.env.VUE_APP_BASE_URI}social-authentication-redirect`;
    },
    async sendResetPasswordUrlToEmail() {
      if (!this.isEmailValid) {
        toast.info('먼저 이메일을 입력하세요. 그 주소로 재설정 방법을 보내 드립니다.');
        return;
      }
      this.isLoading = true;
      await sendResetPasswordUrlToEmail(this.email)
      .then(() => {
        toast.success(`${this.email} 로 비밀번호 재설정 방법을 보냈습니다.`);
      }).catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
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

.auth-logo {
  justify-self: start;
}

.logo {
  height: 26px;
}

.auth-title {
  font-size: var(--text-2xl);
  margin-top: var(--s-2);
}

.auth-lead {
  margin-top: calc(var(--s-3) * -1);
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--s-2);
}

.link-button {
  font-size: var(--text-xs);
  color: var(--accent-text);
  font-weight: 600;
}

.link-button:hover {
  text-decoration: underline;
}

.or-separator {
  position: relative;
  text-align: center;
  margin-top: var(--s-2);
}

.or-separator::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 1px solid var(--border);
}

.or-separator span {
  position: relative;
  padding: 0 10px;
  background: var(--surface);
  color: var(--text-3);
  font-size: var(--text-xs);
}

.social-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--s-3);
}

.social-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  display: block;
}

.auth-foot {
  text-align: center;
  font-size: var(--text-sm);
}

.auth-foot a {
  font-weight: 700;
}

@media (max-width: 500px) {
  .auth-page {
    padding-top: var(--s-6);
  }

  .auth-card {
    padding: var(--s-6);
    box-shadow: none;
  }
}
</style>
