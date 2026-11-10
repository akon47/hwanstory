<template>
  <router-link class="notification" :to="relatedPostUrl ?? '/'" @click="$emit('navigate')">
    <span class="icon"><app-icon name="comment" :size="16"/></span>
    <span class="body">
      <span class="text">
        <b>{{ notification?.comment?.author?.name }}</b>님이
        <b class="post-title">{{ notification?.comment?.post?.title }}</b>{{ isMention ? '의 댓글에서 회원님을 언급했습니다' : '에 댓글을 남겼습니다' }}
      </span>
      <span class="excerpt">{{ notification?.comment?.content }}</span>
      <span class="time">{{ relativeTime }}</span>
    </span>
  </router-link>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { CommentNotificationDto } from '@/api/models/notification.dtos';
import AppIcon from '@/components/common/AppIcon.vue';
import { formatRelativeDate } from '@/utils/format';

export default defineComponent({
  name: 'CommentNotificationItem',
  components: { AppIcon },
  props: {
    notification: Object as PropType<CommentNotificationDto>,
  },
  emits: ['navigate'],
  computed: {
    relativeTime(): string {
      return formatRelativeDate(this.notification?.createdAt);
    },
    // 언급 알림(@블로그Id)도 이 항목으로 그린다.
    isMention(): boolean {
      return this.notification?.notificationType === 'MENTION';
    },
    relatedPostUrl(): string | null {
      const simplePost = this.notification?.comment?.post;
      const blogId = simplePost?.author?.blogId;
      const postUrl = simplePost?.postUrl;
      if (!blogId || !postUrl) {
        return null;
      }
      return `/${blogId}/posts/${postUrl}`;
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
  background: var(--accent-soft);
  color: var(--accent-text);
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

.post-title {
  color: var(--accent-text);
}

.excerpt {
  color: var(--text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  color: var(--text-3);
  font-size: var(--text-xs);
}
</style>
