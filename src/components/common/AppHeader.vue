<template>
  <header class="app-header">
    <div class="container header-inner">
      <router-link class="logo" to="/" aria-label="Hwan'Story 홈" @click="clearCachedMainPosts">
        <img class="logo-text" src="@/assets/logo-title.svg" alt="Hwan'Story"/>
        <img class="logo-symbol" src="@/assets/logo-symbol.svg" alt="Hwan'Story"/>
      </router-link>

      <form class="search" role="search" @submit.prevent="submitSearch">
        <app-icon class="search-icon" name="search" :size="18"/>
        <input ref="search-input" class="search-input" type="search" v-model="keyword" placeholder="글 검색"
               aria-label="글 검색" autocomplete="off"/>
      </form>

      <div class="actions">
        <router-link class="btn btn-icon mobile-only" to="/search" aria-label="검색">
          <app-icon name="search"/>
        </router-link>
        <button class="btn btn-icon" type="button" :aria-label="isDarkTheme ? '밝은 테마로' : '어두운 테마로'"
                :title="isDarkTheme ? '밝은 테마로' : '어두운 테마로'" @click="toggleTheme">
          <app-icon :name="isDarkTheme ? 'sun' : 'moon'"/>
        </button>

        <template v-if="isLoggedIn">
          <notification-list-button/>
          <router-link class="btn write-button" to="/write">
            <app-icon name="pen" :size="16"/>
            <span>새 글 작성</span>
          </router-link>
          <account-summary-menu-button/>
        </template>
        <template v-else>
          <router-link class="btn btn-ghost signin-button" to="/signin">로그인</router-link>
          <router-link class="btn" to="/signup">시작하기</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import AccountSummaryMenuButton from '@/components/accounts/AccountSummaryMenuButton.vue';
import NotificationListButton from '@/components/notifications/NotificationListButton.vue';
import AppIcon from '@/components/common/AppIcon.vue';

export default defineComponent({
  name: 'AppHeader',
  components: { AppIcon, NotificationListButton, AccountSummaryMenuButton },
  data() {
    return {
      keyword: (this.$route.query.q as string) ?? '',
    };
  },
  computed: {
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    isDarkTheme(): boolean {
      return store.getters['commonStore/isDarkTheme'] ?? false;
    },
  },
  watch: {
    '$route.query.q'(value) {
      this.keyword = (value as string) ?? '';
    },
  },
  methods: {
    toggleTheme() {
      store.dispatch('commonStore/toggleTheme');
    },
    clearCachedMainPosts() {
      store.dispatch('cacheStore/clearMainPosts');
    },
    submitSearch() {
      const q = this.keyword.trim();
      if (!q) {
        return;
      }
      (this.$refs['search-input'] as HTMLInputElement | undefined)?.blur();
      this.$router.push({ path: '/search', query: { q } });
    },
  },
});
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  background: var(--header-bg);
  backdrop-filter: saturate(160%) blur(14px);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
  border-bottom: 1px solid var(--border);
  transition: background-color var(--theme-changed-transition);
}

.header-inner {
  height: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--s-4);
}

.logo {
  display: inline-flex;
  align-items: center;
  height: 40px;
}

.logo-text {
  height: 26px;
  width: auto;
  margin-top: 6px;
}

.logo-symbol {
  display: none;
  height: 32px;
  width: 32px;
}

.search {
  position: relative;
  justify-self: center;
  width: min(100%, 360px);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 38px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  background: var(--surface-2);
  color: var(--text);
  font-size: var(--text-sm);
  outline: none;
  transition: background-color var(--ease), border-color var(--ease), box-shadow var(--ease);
}

.search-input::placeholder {
  color: var(--text-3);
}

.search-input:focus {
  background: var(--surface);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--s-1);
}

.actions .btn:not(.btn-icon) {
  margin-left: var(--s-1);
}

.write-button span {
  display: inline;
}

.mobile-only {
  display: none;
}

@media (max-width: 760px) {
  .header-inner {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--s-2);
  }

  .search {
    display: none;
  }

  .mobile-only {
    display: inline-flex;
  }

  .logo-text {
    display: none;
  }

  .logo-symbol {
    display: block;
  }

  .write-button {
    width: 38px;
    padding: 0;
    border-radius: var(--radius-pill);
  }

  .write-button span {
    display: none;
  }

  .signin-button {
    display: none;
  }
}
</style>
