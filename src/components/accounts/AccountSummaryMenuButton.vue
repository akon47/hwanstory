<template>
  <div class="account-menu" ref="root">
    <button class="avatar-button" type="button" :aria-expanded="isOpen" aria-haspopup="menu" aria-label="내 메뉴"
            @click="toggle">
      <span class="avatar" :style="profileImageStyle"/>
    </button>
    <transition name="pop">
      <div v-if="isOpen" class="menu" role="menu">
        <div class="menu-head">
          <div class="name">{{ name || '내 계정' }}</div>
          <div class="blog-id subtle small">{{ blogId }}</div>
        </div>
        <div class="menu-sep"/>
        <router-link class="menu-item" role="menuitem" :to="`/${blogId}`" @click="close">
          <app-icon name="home" :size="18"/>내 블로그
        </router-link>
        <router-link class="menu-item" role="menuitem" to="/bookmarks" @click="close">
          <app-icon name="bookmark" :size="18"/>북마크
        </router-link>
        <router-link class="menu-item" role="menuitem" to="/setting" @click="close">
          <app-icon name="settings" :size="18"/>설정
        </router-link>
        <router-link class="menu-item" role="menuitem" to="/tokens" @click="close">
          <app-icon name="bot" :size="18"/>AI 에이전트 · 토큰
        </router-link>
        <router-link v-if="isAdmin" class="menu-item" role="menuitem" to="/admin" @click="close">
          <app-icon name="shield" :size="18"/>관리자
        </router-link>
        <div class="menu-sep"/>
        <button class="menu-item" role="menuitem" type="button" @click="signOut">
          <app-icon name="log-out" :size="18"/>로그아웃
        </button>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { attachmentFileBaseUrl, HttpApiError } from '@/api/common/httpApiClient';
import store from '@/store';
import AppIcon from '@/components/common/AppIcon.vue';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'AccountSummaryMenuButton',
  components: { AppIcon },
  data() {
    return {
      isOpen: false,
    };
  },
  computed: {
    profileImageStyle() {
      const profileImageUrl = store.state.accountStore.profileImageUrl;
      const url = profileImageUrl ? `${attachmentFileBaseUrl}${profileImageUrl}` : require('@/assets/profile.svg');
      return { backgroundImage: `url(${url})` };
    },
    isAdmin(): boolean {
      return store.getters['accountStore/isAdmin'] ?? false;
    },
    blogId(): string {
      return store.state.accountStore.blogId;
    },
    name(): string {
      return store.state.accountStore.name;
    },
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    },
    close() {
      this.isOpen = false;
    },
    onDocumentClick(event: MouseEvent) {
      const root = this.$refs['root'] as HTMLElement | undefined;
      if (this.isOpen && root && !root.contains(event.target as Node)) {
        this.close();
      }
    },
    onKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        this.close();
      }
    },
    async signOut() {
      this.close();
      await store.dispatch('accountStore/signOut')
      .then(() => {
        toast.info('로그아웃했습니다.');
        if (this.$route.path !== '/') {
          this.$router.push('/');
        }
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      });
    },
  },
  mounted() {
    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onKeydown);
  },
});
</script>

<style scoped>
.account-menu {
  position: relative;
  margin-left: var(--s-1);
}

.avatar-button {
  display: block;
  padding: 2px;
  border-radius: 50%;
  transition: box-shadow var(--ease);
}

.avatar-button:hover,
.avatar-button[aria-expanded="true"] {
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.avatar-button .avatar {
  display: block;
  width: 34px;
  height: 34px;
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 230px;
  z-index: 200;
}

.menu-head .name {
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-head .blog-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
