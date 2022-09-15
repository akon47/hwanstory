<template>
  <div class="form-container">
    <div class="form-wrapper">
      <img class="logo" src="@/assets/logo-title.svg"/>
      <div>
        <input :class="{'invalid': email && !isEmailValid}"
               type="text" id="email" v-model="email" placeholder="Email"/>
      </div>
      <div>
        <input :class="{'invalid': password && !isPasswordValid}" @keyup.enter="signIn"
               type="password" id="password" v-model="password" autocomplete="off"
               placeholder="Password"/>
      </div>
      <div class="signup-message">
        <a v-on:click="sendResetPasswordUrlToEmail">비밀번호를 잊으셨나요?</a>
      </div>
      <button :disabled="!isEmailValid || !isPasswordValid || isLoading"
              @click="signIn">
        로그인
      </button>
      <div class="signup-message">
        회원이 아니신가요?
        <router-link to="/signup">
          회원가입
        </router-link>
      </div>
      <div class="or-separator"><span>또는 아래 계정으로 시작하기</span></div>
      <div class="social-login-container">
        <a v-for="social in socials" :key="social"
           :href="getSocialLoginUrl(social)">
          <provider-button :provider="social"/>
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import { apiBaseUrl, HttpApiError } from '@/api/common/httpApiClient';
import ProviderButton from '@/components/common/ProviderButton.vue';
import { sendResetPasswordUrlToEmail } from '@/api/accounts';

export default defineComponent({
  name: 'SigninForm',
  components: { ProviderButton },
  data() {
    return {
      email: '',
      password: '',
      socials: [
        'github',
        'google',
        'facebook',
        'naver',
        'kakao',
        'discord',
        'microsoft',
      ] as Array<String>,
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
      this.isLoading = true;
      await store.dispatch('accountStore/signIn', {
        email: this.email,
        password: this.password,
      })
      .then(() => {
        this.$router.push('/main');
      }).catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    getSocialLoginUrl(registrationId: String) {
      return `${apiBaseUrl}v1/authentication/oauth2/${registrationId}?redirect_uri=${location.protocol}//${location.hostname}/social-authentication-redirect`;
    },
    async sendResetPasswordUrlToEmail() {
      if (!this.isEmailValid) {
        alert('이메일 형식을 확인해주세요.');
        return;
      }
      this.isLoading = true;
      await sendResetPasswordUrlToEmail(this.email)
      .then(() => {
        alert(`계정 비밀번호 재설정에 대한 방법을 ${this.email} 이메일로 보냈습니다.`);
      }).catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
  },
});
</script>

<style scoped>

.logo {
  height: 30px;
}

.signup-message {
  margin-top: -8px;
  font-size: 10pt;
  color: #8e9297;
}

.signup-message a {
  color: var(--base-color);
  font-weight: bold;
}

.or-separator {
  border-bottom: 1px solid var(--border-color);
  padding: 10px 0;
  margin-top: -10px;
  margin-bottom: 0.5em;
  position: relative;
  box-sizing: border-box;
}

.or-separator span {
  font-size: 0.75em;
  width: 14em;
  left: calc(50% - 7em);
  position: absolute;
  text-align: center;
  background-color: var(--content-item-background-color);
}

.social-login-container {
  display: flex;
  flex-wrap: wrap;

  gap: 1em;

  justify-items: center;
  justify-content: center;
}

.social-login-container a {
  width: 48px;
  height: 48px;
  cursor: pointer;
}

</style>
