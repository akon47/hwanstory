<template>
  <div class="form-container">
    <div class="form-wrapper">
      <img class="logo" src="@/assets/logo-title.svg"/>
      <div>
        <input :class="{'invalid': name && !isNameValid}"
               type="text" id="name" v-model="name" placeholder="이름"/>
      </div>
      <div v-if="!isRegisterBySocial">
        <input type="password" id="password" v-model="password" autocomplete="off"
               placeholder="비밀번호"/>
      </div>
      <div v-if="!isRegisterBySocial">
        <input :class="{'invalid': passwordRepeat && !isPasswordRepeatValid}"
               type="password" id="password-repeat" v-model="passwordRepeat" autocomplete="off"
               placeholder="비밀번호 확인"/>
      </div>
      <div>
        <input :class="{'invalid': blogId && !isBlogIdValid}"
               type="text" id="blogId" v-model="blogId" placeholder="블로그 ID" autocomplete="off"/>
      </div>
      <div>
        <input :class="{'invalid': email && !isEmailValid}"
               type="text" id="email" v-model="email" placeholder="이메일" :disabled="isRegisterBySocial"/>
        <a v-if="!isRegisterBySocial" class="verify-code-button" :disabled="!isPasswordValid"
           v-on:click="sendEmailVerifyCode">인증코드 발송</a>
      </div>
      <div v-if="isEmailVerifyCodeSent && !isRegisterBySocial">
        <input type="text" id="verify-code" v-model="emailVerifyCode" placeholder="이메일 인증코드"/>
      </div>
      <button
          :disabled="!isNameValid || (!isPasswordValid && !isRegisterBySocial) || !isPasswordRepeatValid || !isBlogIdValid || !isEmailValid || isLoading"
          @click="signUp"
      >
        회원가입
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { sendVerifyCodeToEmail, signUp } from '@/api/accounts';
import { HttpApiError } from '@/api/common/httpApiClient';

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

      const regex = /^@?[-a-zA-Z\d_]+$/;
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
    isRegisterBySocial() {
      return this.$route.params?.socialEmail !== undefined && this.$route.params?.registerToken !== undefined;
    },
  },
  methods: {
    async signUp() {
      this.isLoading = true;
      await signUp({
        name: this.name,
        email: this.email,
        password: this.registerToken ? null : this.password,
        blogId: this.blogId,
        emailVerifyCode: this.registerToken ? null : this.emailVerifyCode,
      }, this.registerToken ? this.registerToken : null)
      .then(() => {
        this.$router.push('/signin');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
    async sendEmailVerifyCode() {
      if (!this.isEmailValid) {
        alert('이메일 형식을 확인해주세요.');
        return;
      }

      await sendVerifyCodeToEmail(this.email)
      .then(() => {
        this.isEmailVerifyCodeSent = true;
        alert('인증 코드를 발송하였습니다.');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
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

.logo {
  height: 30px;
}

.form-wrapper div {
  display: flex;
  flex-direction: column;
}

.verify-code-button {
  align-self: end;
  margin-top: 3px;
  font-weight: bold;
}

</style>
