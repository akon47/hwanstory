<template>
  <div class="notification-container">
    <div class="icon"/>
    <div class="count" v-show="notifications.length > 0">
      {{ notifications.length }}
    </div>
    <div class="dropdown-container">
      <details>
        <summary/>
        <div class="dropdown-content">
          <div class="header">
            알림
          </div>
          <div class="notification-item" v-for="(notification, index) in notifications" :key="notification.id"
               :class="{ last: index == notifications.length - 1 }">
            <!--suppress JSValidateTypes -->
            <comment-notification-item v-if="notification.notificationType == 'COMMENT'" :notification="notification"/>

            <button @click="deleteNotification(notification.id)">삭제</button>
          </div>
          <div class="no-notification" v-if="notifications.length == 0">
            새로운 알림이 없습니다.
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { NotificationDto } from "@/api/models/notification.dtos";
import { deleteNotification, getNotifications } from "@/api/notifications";
import { HttpApiError } from "@/api/common/httpApiClient";
import CommentNotificationItem from "@/components/notifications/CommentNotificationItem.vue";

export default defineComponent({
  name: 'NotificationListButton',
  components: { CommentNotificationItem },
  data() {
    return {
      notifications: Array<NotificationDto>(),
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
    };
  },
  methods: {
    async fetchNotifications(cursorId: string | null = null) {
      try {
        this.isLoading = true;
        await getNotifications(20, cursorId)
        .then((notifications) => {
          if (notifications.first) {
            this.notifications = notifications.data;
          } else {
            notifications.data.forEach((post) => {
              this.notifications.push(post);
            });
          }
          this.cursorId = (!notifications.last && notifications.cursorId) ? notifications.cursorId : '';
          this.isNoMorePage = notifications.last;
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      } finally {
        this.isLoading = false;
      }
    },
    async deleteNotification(notificationId: string) {
      try {
        this.isLoading = true;
        await deleteNotification(notificationId)
        .then(() => {
          this.notifications = this.notifications.filter((x) => x.id !== notificationId);
        })
        .catch((error: HttpApiError) => {
          alert(error.getErrorMessage());
        });
      } finally {
        this.isLoading = false;
      }
    }
  },
  mounted() {
    this.fetchNotifications();
  }
});
</script>

<style scoped>

.notification-container {
  position: relative;
  width: 35px;
  height: 35px;
  border-radius: 100%;
  transition: 0.5s;
}

@media (hover: hover) and (pointer: fine) {
  .notification-container:hover {
    background-color: var(--hover-color);
  }
}

.notification-container .icon {
  position: absolute;
  background: var(--base-color);
  mask: url(@/assets/notifications.svg) no-repeat center;
  mask-size: 25px;

  width: 100%;
  height: 100%;

  transform: rotate(30deg);
  transition: 0.5s;
}

.notification-container .count {
  position: absolute;
  top: -5px;
  right: -5px;

  font-size: 12px;

  padding: 0 5px;

  background: red;
  border-radius: 100%;
}

.dropdown-container {
  display: inline-block;

  width: 100%;
  height: 100%;
  margin: auto;

  border-radius: 100%;
  position: relative;

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  z-index: 1;
}

.dropdown-container details {
  width: 100%;
  height: 100%;
}

.dropdown-container summary {
  list-style: none;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.dropdown-container summary::-webkit-details-marker {
  display: none;
}

.dropdown-container .dropdown-content {
  position: absolute;
  min-inline-size: max-content;
  background-color: var(--background-color);
  right: 0px;
}

.dropdown-container details[open] summary::before {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  content: "";
  cursor: default;
  height: 100vh;
}

.dropdown-container .dropdown-content {
  display: grid;

  grid-template-columns: 350px;
  grid-auto-rows: auto;

  grid-row-gap: var(--half-base-gab);

  margin-top: calc(var(--half-base-gab) / 2);
  border: 1px solid var(--border-color);
  border-radius: var(--base-border-radius);

  padding: var(--half-base-gab);

  font-size: 12px;
}

@media (max-width: 500px) {
  .dropdown-container .dropdown-content {
    position: fixed;
    left: 0;
    margin: var(--half-base-gab);
  }

  .dropdown-container .dropdown-content {
    grid-template-columns: auto;
  }
}

.dropdown-content .header {
  font-size: 1.25em;

  padding-bottom: var(--half-base-gab);
  border-bottom: 1px solid var(--border-color);
}

.notification-item {
  display: grid;

  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto;

  grid-gap: var(--half-base-gab);
}

.notification-item button {
  align-self: center;
}

.notification-item:not(.last) {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--half-base-gab);
}

.no-notification {
  font-size: 1.25em;
  text-align: center;
  padding: 1em 0;
}

</style>