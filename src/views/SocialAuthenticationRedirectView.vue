<template>
  <div>

  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import { TokenDto } from '@/api/models/authentication.dtos';
import { HttpApiError } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'SocialAuthenticationRedirectView',
  props: {
    needRegister: {
      type: Boolean,
      required: true,
    },
    accessToken: {
      type: String,
      required: false,
    },
    refreshToken: {
      type: String,
      required: false,
    },
    registerToken: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    profileImageUrl: {
      type: String,
      required: false,
    },
  },
  async mounted() {
    if (this.needRegister) {
      this.$router.push({
        name: 'Signup',
        params: {
          socialEmail: this.email,
          socialName: this.name,
          socialProfileImageUrl: this.profileImageUrl,
          registerToken: this.registerToken
        },
      });
    } else {
      await store.dispatch('accountStore/setToken', {
        accessToken: this.accessToken,
        accessTokenExpiresIn: 1,
        refreshToken: this.refreshToken,
        refreshTokenExpiresIn: 1,
      } as TokenDto)
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      })
      .finally(() => {
        this.$router.push('/main');
      });
    }
  },
});
</script>

<style scoped>

</style>