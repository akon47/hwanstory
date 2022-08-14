<template>
  <div class="form-container">
    <div class="form-wrapper">
      <div>
        <input :class="{'invalid': email && !isEmailValid}"
               type="text" id="email" v-model="email" placeholder="Email"/>
      </div>
      <div>
        <input :class="{'invalid': password && !isPasswordValid}"
               type="password" id="password" v-model="password" autocomplete="off"
               placeholder="Password"/>
      </div>
      <button class="form-button"
              :disabled="!isEmailValid || !isPasswordValid || isLoading"
              @click="signIn">
        로그인
      </button>
      <div class="signup-message">
        회원이 아니신가요?
        <router-link to="/signup">
          회원가입
        </router-link>
      </div>
    </div>
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
    async signIn() {
      await store.dispatch('accountStore/signIn', {
        email: this.email,
        password: this.password,
      })
      .then(() => {
        this.$router.push('/main');
      }).catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
  },
});
</script>

<style scoped>

.signup-message {
  margin-top: -5px;
  font-size: 10pt;
  color: #8e9297;
}

.signup-message a {
  color: var(--base-color);
  font-weight: bold;
}

</style>
