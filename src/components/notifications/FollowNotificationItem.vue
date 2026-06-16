<template>
  <div class="notification-item-container">
    <div class="header">
      <span class="title">팔로우</span>&nbsp;<span class="content">
        <a :href="followerUrl">{{ notification.follower.name }}</a>님이 회원님을 팔로우합니다.
      </span>
    </div>
    <div class="footer">
      {{ longCreateAt }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { FollowNotificationDto } from "@/api/models/notification.dtos";

export default defineComponent({
  name: 'FollowNotificationItem',
  props: {
    notification: Object as PropType<FollowNotificationDto>,
  },
  computed: {
    longCreateAt() {
      if (!this.notification?.createdAt) {
        return null;
      }
      const date = new Date(this.notification.createdAt);
      const hours = `${date.getHours()}`.padStart(2, '0');
      const minutes = `${date.getMinutes()}`.padStart(2, '0');
      return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${hours}:${minutes}`;
    },
    followerUrl() {
      const blogId = this.notification?.follower?.blogId;
      if (!blogId) {
        return null;
      }
      return `/${blogId}`;
    },
  },
  methods: {},
});
</script>

<style scoped>

.notification-item-container .header {
  font-size: 1.2em;
  display: flex;
}

.notification-item-container .footer {
  font-size: 1em;
}

.notification-item-container .title {
  white-space: nowrap;
  font-weight: bold;
}

.notification-item-container .content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-item-container a {
  color: var(--base-color);
  font-weight: bold;
}

</style>
