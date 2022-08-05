<template>
  <div>
    <form @submit.prevent="submitForm">
      <div>
        <label for="email">이메일</label>
        <input type="text" id="email" v-model="email"/>
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
      <button
          :disabled="!isEmailValid || !isPasswordValid || isLoading"
          type="submit"
      >
        로그인
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {useStore} from "vuex";
import {AuthenticationInfoDto} from "@/models/authentication/authentication.dtos";

export default defineComponent({
  name: "SigninForm",
  setup() {
    const store = useStore();
    const signIn = (authenticationInfoDto: AuthenticationInfoDto) => store.dispatch("accountStore/signIn", authenticationInfoDto);

    return {signIn};
  },
  data() {
    return {
      email: "",
      password: "",
      isLoading: false
    }
  },
  computed: {
    isEmailValid(): boolean {
      const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(this.email);
    },
    isPasswordValid(): boolean {
      return this.password.length > 0;
    },
  },
  methods: {
    async submitForm() {
      const dto: AuthenticationInfoDto = {
        email: this.email,
        password: this.password
      };
      await this.signIn(dto);
      this.$router.push("/main");
    },
  }
});
</script>

<style scoped>

</style>