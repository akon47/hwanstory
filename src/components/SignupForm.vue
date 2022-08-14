<template>
  <div class="form-container">
    <div class="form-wrapper">
      <div>
        <input :class="{'invalid': name && !isNameValid}"
               type="text" id="name" v-model="name" placeholder="이름"/>
      </div>
      <div>
        <input type="password" id="password" v-model="password" autocomplete="off"
               placeholder="비밀번호"/>
      </div>
      <div>
        <input :class="{'invalid': passwordRepeat && !isPasswordRepeatValid}"
               type="password" id="password-repeat" v-model="passwordRepeat" autocomplete="off"
               placeholder="비밀번호 확인"/>
      </div>
      <div>
        <input :class="{'invalid': blogId && !isBlogIdValid}"
               type="text" id="blogId" v-model="blogId" placeholder="블로그 ID"/>
      </div>
      <div>
        <input :class="{'invalid': email && !isEmailValid}"
               type="text" id="email" v-model="email" placeholder="이메일"/>
        <a class="verify-code-button" :disabled="!isPasswordValid" v-on:click="sendEmailVerifyCode">인증코드 발송</a>
      </div>
      <div v-if="isEmailVerifyCodeSended">
        <input type="text" id="verify-code" v-model="emailVerifyCode" placeholder="이메일 인증코드"/>
      </div>
      <button
          class="form-button"
          :disabled="!isNameValid || !isPasswordValid || !isPasswordRepeatValid || !isBlogIdValid || !isEmailValid || isLoading"
          @click="signUp"
      >
        회원가입
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { sendVerifyCodeToEmail } from '@/api/accounts';
import store from '@/store';
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
      isEmailVerifyCodeSended: false,
      isLoading: false,
    };
  },
  computed: {
    isNameValid(): boolean {
      return this.name.length > 0;
    },
    isBlogIdValid(): boolean {
      return this.blogId.length > 0;
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
  },
  methods: {
    async signUp() {
      await store.dispatch('accountStore/signUp', {
        name: this.name,
        email: this.email,
        password: this.password,
        blogId: this.blogId,
        emailVerifyCode: this.emailVerifyCode,
      })
      .then(() => {
        this.$router.push('/signin');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    clearForm() {
      this.name = '';
      this.email = '';
      this.password = '';
      this.passwordRepeat = '';
      this.blogId = '';
      this.emailVerifyCode = '';
    },
    async sendEmailVerifyCode() {
      await sendVerifyCodeToEmail(this.email)
      .then(() => {
        alert('인증 코드를 발송하였습니다.');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
  },
});
</script>

<style scoped>

.verify-code-button {
  position: relative;
  right: 0;
}

</style>
