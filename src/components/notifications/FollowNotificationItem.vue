<template>
  <router-link class="notification" :to="followerUrl ?? '/'" @click="$emit('navigate')">
    <span class="icon"><app-icon name="users" :size="16"/></span>
    <span class="body">
      <span class="text"><b>{{ notification?.follower?.name }}</b>님이 회원님을 팔로우합니다</span>
      <span class="time">{{ relativeTime }}</span>
    </span>
  </router-link>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { FollowNotificationDto } from '@/api/models/notification.dtos';
import AppIcon from '@/components/common/AppIcon.vue';
import { formatRelativeDate } from '@/utils/format';

export default defineComponent({
  name: 'FollowNotificationItem',
  components: { AppIcon },
  props: {
    notification: Object as PropType<FollowNotificationDto>,
  },
  emits: ['navigate'],
  computed: {
    relativeTime(): string {
      return formatRelativeDate(this.notification?.createdAt);
    },
    followerUrl(): string | null {
      const blogId = this.notification?.follower?.blogId;
      return blogId ? `/${blogId}` : null;
    },
  },
});
</script>

<style scoped>
.notification {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-3);
  color: var(--text);
  text-decoration: none;
  font-size: var(--text-sm);
}

.notification:hover {
  text-decoration: none;
}

.icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--success-soft);
  color: var(--success);
}

.body {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.text {
  line-height: 1.45;
  word-break: keep-all;
}

.time {
  color: var(--text-3);
  font-size: var(--text-xs);
}
</style>
