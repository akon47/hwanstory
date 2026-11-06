<template>
  <nav class="tabs feed-tabs" aria-label="글 목록 종류">
    <router-link to="/">
      <app-icon name="clock" :size="16"/>최근 글
    </router-link>
    <router-link to="/top">
      <app-icon name="flame" :size="16"/>인기 글
    </router-link>
    <router-link to="/viewing">
      <app-icon name="radio" :size="16"/>지금 보는 중
      <span v-if="viewingCount > 0" class="count">{{ viewingCount }}</span>
    </router-link>
    <router-link v-if="isLoggedIn" to="/feed">
      <app-icon name="users" :size="16"/>팔로잉
    </router-link>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import AppIcon from '@/components/common/AppIcon.vue';

export default defineComponent({
  name: 'FeedTabs',
  components: { AppIcon },
  computed: {
    isLoggedIn(): boolean {
      return store.getters['accountStore/isLoggedIn'] ?? false;
    },
    // 지금 누군가 보고 있는 글 수
    viewingCount(): number {
      const counts = store.getters['commonStore/postViewerCounts'] as Record<string, number>;
      return Object.values(counts ?? {}).filter((count) => count > 0).length;
    },
  },
});
</script>

<style scoped>
.feed-tabs a {
  padding-inline: 12px;
}

@media (max-width: 500px) {
  .feed-tabs a {
    padding-inline: 10px;
    font-size: var(--text-sm);
  }

  .feed-tabs a .app-icon {
    display: none;
  }
}
</style>
