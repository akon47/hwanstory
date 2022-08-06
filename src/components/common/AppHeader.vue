<template>
  <div class="header-container">
    <router-link to="/main">
      <button>main</button>
    </router-link>
    <router-link to="/signup">
      <button>signup</button>
    </router-link>
    <router-link to="/signin">
      <button>signin</button>
    </router-link>
    <button @click="showCurrentAccountInfo">내 정보</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getCurrentAccount } from '@/api/accounts';

export default defineComponent({
  name: 'AppHeader',
  methods: {
    async showCurrentAccountInfo() {
      await getCurrentAccount()
      .then((response) => {
        alert(JSON.stringify(response, null, 2));
      })
      .catch((error) => {
        alert(error.message);
      });
    },
  },
});
</script>

<style scoped>
.header-container {
}
</style>
