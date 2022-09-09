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
      <div class="or-separator"><span>또는 아래 계정으로 로그인</span></div>
      <div class="social-login-container">
        <a v-for="social in socials" :key="social.registrationId"
           :href="getSocialLoginUrl(social.registrationId)">
          <provider-button :provider="social.registrationId" />
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

interface Social {
  readonly iconUrl: String,
  readonly registrationId: String
}

export default defineComponent({
  name: 'SigninForm',
  components: { ProviderButton },
  data() {
    return {
      email: '',
      password: '',
      socials: [
        {
          iconUrl: '',
          registrationId: 'github',
        },
        {
          iconUrl: '',
          registrationId: 'google',
        },
        {
          iconUrl: '',
          registrationId: 'facebook',
        },
        {
          iconUrl: '',
          registrationId: 'naver',
        },
        {
          iconUrl: '',
          registrationId: 'kakao',
        },
      ] as Array<Social>,
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
    }
  },
});
</script>

<style scoped>

.logo {
  height: 30px;
}

.signup-message {
  margin-top: -5px;
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
  width: 12em;
  left: calc(50% - 6em);
  position: absolute;
  text-align: center;
  background-color: var(--content-item-background-color);
}

.social-login-container {
  display: grid;

  grid-auto-columns: 48px;
  grid-template-rows: 48px;

  grid-auto-flow: column;

  grid-column-gap: 1em;

  justify-items: center;
  justify-content: center;
}

.social-login-container a {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

</style>
