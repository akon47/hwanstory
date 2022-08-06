<template>
  <div>
    <form @submit.prevent>
      <div>
        <label for="name">유저이름 또는 별명</label>
        <input type="text" id="name" v-model="name"/>
      </div>
      <div>
        <label for="password">비밀번호</label>
        <input type="password" id="password" v-model="password" autocomplete="off"/>
      </div>
      <div>
        <label for="password-repeat">비밀번호 확인</label>
        <input type="password" id="password-repeat" v-model="passwordRepeat" autocomplete="off"/>
        <p v-if="passwordRepeat && !isPasswordRepeatValid">비밀번호 확인이 비밀번호와 다릅니다.</p>
      </div>
      <div>
        <label for="email">이메일</label>
        <input type="text" id="email" v-model="email"/>
        <p v-if="email && !isEmailValid">이메일을 확인해주세요.</p>
      </div>
      <div>
        <label for="verify-code">이메일 인증코드</label>
        <input type="text" id="verify-code" v-model="emailVerifyCode"/>
        <button v-on:click="sendEmailVerifyCode">인증코드 발송</button>
      </div>
      <button
          :disabled="
          !isNameValid || !isPasswordValid || !isPasswordRepeatValid || !isEmailValid || isLoading
        "
          @click="submitForm"
      >
        회원가입
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { sendVerifyCodeToEmail } from '@/api/accounts';
import { useStore } from 'vuex';
import { AccountCreateDto } from '@/api/models/account.dtos';

export default defineComponent({
  name: 'SignupForm',
  setup() {
    const store = useStore();
    const signUp = (createAccountDto: AccountCreateDto) =>
        store.dispatch('accountStore/signUp', createAccountDto);

    return {signUp};
  },
  data() {
    return {
      name: '',
      password: '',
      passwordRepeat: '',
      email: '',
      emailVerifyCode: '',
      isLoading: false,
    };
  },
  computed: {
    isNameValid(): boolean {
      return this.name.length > 0;
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
    async submitForm() {
      await this.signUp({
        name: this.name,
        email: this.email,
        password: this.password,
        emailVerifyCode: this.emailVerifyCode,
      })
      .then(() => {
        this.$router.push('/main');
      })
      .catch((error) => {
        alert(error.message);
      });
    },
    clearForm() {
      this.name = '';
      this.password = '';
      this.passwordRepeat = '';
      this.email = '';
      this.emailVerifyCode = '';
    },
    async sendEmailVerifyCode() {
      await sendVerifyCodeToEmail(this.email)
      .then(() => {
        alert('인증 코드를 발송하였습니다.');
      })
      .catch((error) => {
        alert(error.message);
      });
    },
  },
});
</script>

<style scoped></style>
