<template>
  <div>
    <form @submit.prevent="submitForm">
      <div>
        <label for="email">이메일</label>
        <input type="text" id="email" v-model="email"/>
        <p v-if="email && !isEmailValid">이메일을 확인해주세요.</p>
      </div>
      <div>
        <label for="password">비밀번호</label>
        <input type="password" id="password" v-model="password" autocomplete="off"/>
      </div>
      <button :disabled="!isEmailValid || !isPasswordValid || isLoading" type="submit">
        로그인
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import { HttpApiError } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'SigninForm',
  data() {
    return {
      email: '',
      password: '',
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
    async submitForm() {
      await store.dispatch('accountStore/signIn', {
        email: this.email,
        password: this.password,
      })
      .then(() => {
        this.$router.push('/main');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
  },
});
</script>

<style scoped>

</style>
