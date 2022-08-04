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
      </div>
      <div>
        <label for="verify-code">이메일 인증코드</label>
        <input type="text" id="verify-code" v-model="verifyCode"/>
        <button v-on:click="sendVerifyCode">인증코드 발송</button>
      </div>
      <button
          :disabled="!isUsernameValid || !isPasswordValid || !isPasswordRepeatValid || isLoading"
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
    }
  },
  methods: {
    async submitForm() {
      await sendVerifyCodeToEmail(this.email);
    },
    clearForm() {
      this.username = "";
      this.password = "";
      this.passwordRepeat = "";
      this.email = "";
      this.verifyCode = "";
    },
    async sendVerifyCode() {

    }
  }
});
</script>

<style scoped>

</style>