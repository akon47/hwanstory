<template>
  <div class="notification-item-container">
    <div class="header">
      <span class="title">댓글</span>&nbsp;<span class="content">{{ notification.comment.content }}</span>
    </div>
    <div class="footer">
      by {{ notification.comment.author.name }} <span>&#183;</span> {{ longCreateAt }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { CommentNotificationDto } from "@/api/models/notification.dtos";

export default defineComponent({
  name: 'CommentNotificationItem',
  props: {
    notification: Object as PropType<CommentNotificationDto>,
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
  },
  methods: {},
});
</script>

<style scoped>

.notification-item-container {

}

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

</style>