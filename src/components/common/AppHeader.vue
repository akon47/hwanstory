<template>
  <div class="header-container">
    <div class="logo">
      <router-link to="/main">
        <button>main</button>
      </router-link>
    </div>
    <div class="search">

    </div>
    <div class="">

    </div>
    <div class="account">
      <div v-if="isLoggedIn" class="logged-in-container">
        <router-link to="/write">
          <button>새 글 작성</button>
        </router-link>
        <account-summary-menu-button></account-summary-menu-button>
      </div>
      <div v-else>
        <router-link to="/signin">
          <button>시작하기</button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import AccountSummaryMenuButton from "@/components/accounts/AccountSummaryMenuButton.vue";

export default defineComponent({
  name: 'AppHeader',
  components: { AccountSummaryMenuButton },
  computed: {
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
  },
  methods: {

  },
});
</script>

<style scoped>
.header-container {
  display: grid;

  grid-template-columns: auto auto 1fr auto;
  grid-template-rows: 1fr;

  align-items: center;

  padding: 0px 20px;
  height: 80px;
}

.logged-in-container {
  display: grid;

  grid-template-columns: auto auto;
  grid-template-rows: 1fr;

  align-items: center;

  column-gap: 20px;
}

button {
  width: 100px;
  height: 30px;
}

</style>
