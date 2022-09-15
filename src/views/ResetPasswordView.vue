<template>
  <div class="reset-password-container">
    <div class="form-container">
      <div class="form-wrapper">
        <div class="title">
          비밀번호 재설정
        </div>
        <div>
          <input type="password" v-model="password" autocomplete="off"
                 placeholder="새 비밀번호"/>
        </div>
        <div>
          <input :class="{'invalid': passwordRepeat && !isPasswordRepeatValid}"
                 type="password" v-model="passwordRepeat" autocomplete="off"
                 placeholder="새 비밀번호 확인"/>
        </div>
        <button
            :disabled="!isPasswordValid || !isPasswordRepeatValid || isLoading"
            @click="resetPassword"
        >
          비밀번호 변경하기
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { resetPassword } from '@/api/accounts';
import { HttpApiError } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'ResetPasswordView',
  props: {
    token: {
      type: String,
      require: true,
    },
  },
  data() {
    return {
      password: '',
      passwordRepeat: '',
      isLoading: false,
    };
  },
  computed: {
    isPasswordValid(): boolean {
      return this.password.length > 0;
    },
    isPasswordRepeatValid(): boolean {
      return this.password === this.passwordRepeat;
    },
  },
  methods: {
    async resetPassword() {
      if (!this.token) {
        return;
      }

      this.isLoading = true;
      await resetPassword({
        newPassword: this.password,
        resetPasswordToken: this.token,
      })
      .then(() => {
        alert('비밀번호가 변경되었습니다.');
        this.$router.push('/signin');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
        this.$router.push('/main');
      })
      .finally(() => {
        this.isLoading = false;
      });
    },
  },
})
;
</script>

<style scoped>

.reset-password-container {
  display: grid;

  width: 100%;
  height: 100%;
}

.reset-password-container .title {
  font-size: 1.5em;
  font-weight: bold;
}

</style>
