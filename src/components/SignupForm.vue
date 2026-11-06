<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="signUp">
      <router-link class="auth-logo" to="/" aria-label="Hwan'Story 홈">
        <img class="logo" src="@/assets/logo-title.svg" alt="Hwan'Story"/>
      </router-link>
      <h1 class="auth-title">회원가입</h1>
      <p v-if="isRegisterBySocial" class="auth-lead muted">소셜 계정으로 확인했어요. 이름과 블로그 주소만 정하면 끝나요.</p>
      <p v-else class="auth-lead muted">1분이면 내 블로그가 생겨요.</p>

      <div class="field">
        <label for="name">이름</label>
        <input id="name" class="input" :class="{ invalid: name && !isNameValid }" type="text" v-model.trim="name"
               placeholder="글에 표시될 이름" maxlength="32" autocomplete="name"/>
      </div>

      <div class="field">
        <label for="blogId">블로그 주소</label>
        <div class="input-with-prefix">
          <span class="prefix">hwanstory.kr/@</span>
          <input id="blogId" class="input" :class="{ invalid: blogId && !isBlogIdValid }" type="text" v-model.trim="blogId"
                 placeholder="my-blog" autocomplete="off" spellcheck="false"/>
        </div>
        <span class="hint" :class="{ 'error-text': blogId && !isBlogIdValid }">영문·숫자·하이픈(-)·밑줄(_) 2자 이상. 나중에 바꿀 수 없어요.</span>
      </div>

      <div class="field">
        <label for="email">이메일</label>
        <div class="email-row">
          <input id="email" class="input" :class="{ invalid: email && !isEmailValid }" type="email" v-model.trim="email"
                 placeholder="you@example.com" :disabled="isRegisterBySocial" autocomplete="email" inputmode="email"/>
          <button v-if="!isRegisterBySocial" class="btn btn-secondary" type="button"
                  :disabled="!isEmailValid || isLoading || isCodeSending" @click="sendEmailVerifyCode">
            {{ isEmailVerifyCodeSent ? '다시 발송' : '인증코드 발송' }}
          </button>
        </div>
        <span v-if="!isRegisterBySocial" class="hint">입력한 주소로 6자리 인증코드를 보내 드려요.</span>
      </div>

      <div v-if="isEmailVerifyCodeSent && !isRegisterBySocial" class="field">
        <label for="verify-code">이메일 인증코드</label>
        <input id="verify-code" class="input code-input" type="text" v-model.trim="emailVerifyCode" placeholder="인증코드"
               autocomplete="one-time-code" inputmode="numeric"/>
      </div>

      <template v-if="!isRegisterBySocial">
        <div class="field">
          <label for="password">비밀번호</label>
          <input id="password" class="input" type="password" v-model="password" placeholder="비밀번호"
                 autocomplete="new-password"/>
        </div>
        <div class="field">
          <label for="password-repeat">비밀번호 확인</label>
          <input id="password-repeat" class="input" :class="{ invalid: passwordRepeat && !isPasswordRepeatValid }"
                 type="password" v-model="passwordRepeat" placeholder="비밀번호를 한 번 더" autocomplete="new-password"/>
          <span v-if="passwordRepeat && !isPasswordRepeatValid" class="error-text">비밀번호가 서로 다릅니다.</span>
        </div>
      </template>

      <button class="btn btn-lg btn-block" type="submit" :disabled="!canSubmit || isLoading">
        {{ isLoading ? '가입 중…' : '가입하고 시작하기' }}
      </button>

      <p class="auth-foot muted">
        가입하면 <router-link to="/privacy-policy">개인정보처리방침</router-link>에 동의한 것으로 봅니다.<br/>
        이미 계정이 있나요? <router-link to="/signin">로그인</router-link>
      </p>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { sendVerifyCodeToEmail, signUp } from '@/api/accounts';
import { HttpApiError } from '@/api/common/httpApiClient';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'SignupForm',
  data() {
    return {
      name: '',
      password: '',
      passwordRepeat: '',
      blogId: '',
      email: '',
      emailVerifyCode: '',
      registerToken: '',
      isEmailVerifyCodeSent: false,
      isCodeSending: false,
      isLoading: false,
    };
  },
  computed: {
    isNameValid(): boolean {
      return this.name.length > 0;
    },
    isBlogIdValid(): boolean {
      if (this.blogId.length < 2) {
        return false;
      }
      const regex = /^[-a-zA-Z\d_]+$/;
      return regex.test(this.blogId);
    },
    isPasswordValid(): boolean {
      return this.password.length > 0;
    },
    isPasswordRepeatValid(): boolean {
      return this.password === this.passwordRepeat;
    },
    isEmailValid(): boolean {
      const regex =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(this.email);
    },
    isRegisterBySocial(): boolean {
      return this.$route.params?.socialEmail !== undefined && this.$route.params?.registerToken !== undefined;
    },
    canSubmit(): boolean {
      if (!this.isNameValid || !this.isBlogIdValid || !this.isEmailValid) {
        return false;
      }
      if (this.isRegisterBySocial) {
        return true;
      }
      return this.isPasswordValid && this.isPasswordRepeatValid && this.emailVerifyCode.length > 0;
    },
  },
  methods: {
    async signUp() {
      if (!this.canSubmit || this.isLoading) {
        return;
      }
      this.isLoading = true;
      await signUp({
        name: this.name,
        email: this.email,
        password: this.registerToken ? null : this.password,
        blogId: `@${this.blogId}`,
        emailVerifyCode: this.registerToken ? null : this.emailVerifyCode,
      }, this.registerToken ? this.registerToken : null)
      .then(() => {
        toast.success('가입을 마쳤습니다. 로그인해 주세요.');
        this.$router.push('/signin');
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async sendEmailVerifyCode() {
      if (!this.isEmailValid) {
        toast.info('이메일 형식을 확인해 주세요.');
        return;
      }
      this.isCodeSending = true;
      await sendVerifyCodeToEmail(this.email)
      .then(() => {
        this.isEmailVerifyCodeSent = true;
        toast.success(`${this.email} 로 인증코드를 보냈습니다. 메일함을 확인하세요.`);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      })
      .finally(() => {
        this.isCodeSending = false;
      });
    },
  },
  mounted() {
    if (this.$route.params.socialEmail) {
      this.email = this.$route.params.socialEmail as string;
    }
    if (this.$route.params.socialName) {
      this.name = this.$route.params.socialName as string;
    }
    if (this.$route.params.registerToken) {
      this.registerToken = this.$route.params.registerToken as string;
    }
  },
});
</script>

<style scoped>
.auth-page {
  display: grid;
  grid-template-columns: minmax(0, 460px);
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

.email-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-2);
}

.email-row .btn {
  height: 42px;
}

.code-input {
  letter-spacing: 0.2em;
  font-family: var(--font-mono);
}

.auth-foot {
  text-align: center;
  font-size: var(--text-sm);
  line-height: 1.7;
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
