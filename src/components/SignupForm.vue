<template>
  <div>
    <form @submit.prevent="submitForm">
      <div>
        <label for="username">유저이름 또는 별명</label>
        <input type="text" id="username" v-model="username"/>
      </div>
      <div>
        <label for="password">비밀번호</label>
        <input
            type="password"
            id="password"
            v-model="password"
            autocomplete="off"
        />
      </div>
      <div>
        <label for="password-repeat">비밀번호 확인</label>
        <input
            type="password"
            id="password-repeat"
            v-model="passwordRepeat"
            autocomplete="off"
        />
        <p v-if="passwordRepeat && !isPasswordRepeatValid">
          비밀번호 확인이 비밀번호와 다릅니다.
        </p>
      </div>
      <div>
        <label for="email">이메일</label>
        <input type="text" id="email" v-model="email"/>
        <p v-if="email && !isEmailValid">
          이메일을 확인해주세요.
        </p>
      </div>
      <div>
        <label for="verify-code">이메일 인증코드</label>
        <input type="text" id="verify-code" v-model="verifyCode"/>
        <button v-on:click="sendVerifyCode">인증코드 발송</button>
      </div>
      <button
          :disabled="!isUsernameValid || !isPasswordValid || !isPasswordRepeatValid || !isEmailValid || isLoading"
          type="submit"
      >
        회원가입
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {sendVerifyCodeToEmail} from "@/api/accounts"

export default defineComponent({
  name: "SignupForm",
  data() {
    return {
      username: "",
      password: "",
      passwordRepeat: "",
      email: "",
      verifyCode: "",
      isLoading: false
    }
  },
  computed: {
    isUsernameValid(): boolean {
      return this.username.length > 0;
    },
    isPasswordValid(): boolean {
      return this.password.length > 0;
    },
    isPasswordRepeatValid(): boolean {
      return this.password === this.passwordRepeat;
    },
    isEmailValid(): boolean {
      const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(this.email);
    },
  },
  methods: {
    async submitForm() {

    },
    clearForm() {
      this.username = "";
      this.password = "";
      this.passwordRepeat = "";
      this.email = "";
      this.verifyCode = "";
    },
    async sendVerifyCode() {
      await sendVerifyCodeToEmail(this.email);
    }
  }
});
</script>

<style scoped>

</style>