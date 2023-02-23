<template>
  <div class="header-background" />
  <div class="header-container">
    <div class="logo">
      <router-link to="/" @click="clearCachedMainPosts">
        <img class="logo-text" src="@/assets/logo-title.svg"/>
        <img class="logo-symbol" src="@/assets/logo-symbol.svg"/>
      </router-link>
    </div>
    <div>
    </div>
    <div class="themes">
      <input id="theme-button" type="checkbox" :checked="isDarkTheme" @change="toggleTheme"/>
      <label class="switch" for="theme-button"/>
    </div>
    <div class="account">
      <div v-if="isLoggedIn" class="logged-in-container">
        <notification-list-button/>
        <router-link to="/write">
          <button>새 글 작성</button>
        </router-link>
        <account-summary-menu-button/>
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
import AccountSummaryMenuButton from '@/components/accounts/AccountSummaryMenuButton.vue';
import NotificationListButton from "@/components/notifications/NotificationListButton.vue";

export default defineComponent({
  name: 'AppHeader',
  components: { NotificationListButton, AccountSummaryMenuButton },
  computed: {
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    isDarkTheme(): boolean {
      return store.getters['commonStore/isDarkTheme'] ?? false;
    },
  },
  methods: {
    toggleTheme() {
      store.dispatch('commonStore/toggleTheme');
    },
    clearCachedMainPosts() {
      store.dispatch('cacheStore/clearMainPosts');
    },
  },
});
</script>

<style scoped>

.header-background {
  position: absolute;
  background-color: var(--header-background-color);
  opacity: 0.85;
  height: 100%;
  width: 100%;
  z-index: -1;
}

.header-container {
  display: grid;

  grid-template-columns: auto 1fr auto auto;
  grid-template-rows: 1fr;

  align-items: center;

  padding: 0px var(--base-gap);
  grid-column-gap: var(--base-gap);

  height: 100%;
}

.logged-in-container {
  display: grid;

  grid-template-columns: auto auto auto;
  grid-template-rows: 1fr;

  align-items: center;
  column-gap: var(--base-gap);
}

.header-container button {
  width: 100px;
  height: 30px;
}

.header-container .logo-text {
  margin-top: 10px;
  height: 30px;
}

.header-container .logo-symbol {
  display: none;
  height: 35px;
}

@media (max-width: 550px) {
  .header-container {
    grid-column-gap: var(--half-base-gab);
  }

  .logged-in-container {
    grid-column-gap: var(--half-base-gab);
  }

  .header-container .logo-text {
    display: none;
  }

  .header-container .logo-symbol {
    display: block;
  }
}

.themes input {
  display: none;
}

.switch {
  background-image: url(@/assets/light-mode.svg);
  background-size: 25px 25px;
  background-position: center;
  background-repeat: no-repeat;
  display: block;
  width: 35px;
  height: 35px;
  color: white;
  border-radius: 100%;
  transform: rotate(90deg);
  transition: 0.5s;
}

.themes input:checked + .switch {
  background-image: url(@/assets/dark-mode.svg);
  transform: rotate(0deg);
}

@media (hover: hover) and (pointer: fine) {
  .themes .switch:hover {
    cursor: pointer;
    background-color: var(--hover-color);
  }
}

</style>
