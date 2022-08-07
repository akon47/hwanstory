<template>
  <div class="header-container">
    <router-link to="/main">
      <button>main</button>
    </router-link>
    <router-link to="/signin">
      <button>signin</button>
    </router-link>
    <router-link to="/signup">
      <button>signup</button>
    </router-link>
    <button @click="signOut">signout</button>
    <button @click="showCurrentAccountInfo">info</button>

    <span v-if="isLoggedIn">
      AccessToken 만료예정: {{ new Date($store.state.accountStore.accessTokenExpiresIn) }}
    </span>
    <span v-else>
      로그인 되어있지 않습니다.
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getCurrentAccount } from '@/api/accounts';
import store from '@/store';
import { HttpApiError } from '@/api/common/httpApiClient';

export default defineComponent({
  name: 'AppHeader',
  computed: {
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
  },
  methods: {
    async showCurrentAccountInfo() {
      await getCurrentAccount()
      .then((response) => {
        alert(JSON.stringify(response, null, 2));
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
    async signOut() {
      await store.dispatch('accountStore/signOut')
      .then(() => {
        alert('로그아웃 되었습니다.');
      })
      .catch((error: HttpApiError) => {
        alert(error.getErrorMessage());
      });
    },
  },
});
</script>

<style scoped>
.header-container {
}

button {
  width: 100px;
  height: 30px;
}

</style>
