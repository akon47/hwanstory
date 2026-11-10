<template>
  <div class="notifications" ref="root">
    <button class="btn btn-icon bell" type="button" :aria-expanded="isOpen" aria-haspopup="true"
            :aria-label="`알림 ${notifications.length}개`" title="알림" @click="toggle">
      <app-icon name="bell"/>
      <span v-if="notifications.length > 0" class="count">{{ notifications.length > 99 ? '99+' : notifications.length }}</span>
    </button>
    <transition name="pop">
      <div v-if="isOpen" class="panel" role="dialog" aria-label="알림">
        <div class="panel-head">
          <span class="panel-title">알림</span>
          <button v-if="notifications.length > 0" class="btn btn-ghost btn-sm" type="button" @click="deleteAll">
            모두 지우기
          </button>
        </div>
        <div v-if="notifications.length === 0" class="empty-state compact">
          <div class="empty-icon"><app-icon name="inbox" :size="24"/></div>
          <div class="empty-title">새로운 알림이 없습니다</div>
          <div class="small">댓글이 달리거나 누군가 팔로우하면 여기에 보여요.</div>
        </div>
        <div v-else class="list">
          <div v-for="notification in notifications" :key="notification.id" class="item">
            <comment-notification-item v-if="notification.notificationType == 'COMMENT' || notification.notificationType == 'MENTION'" :notification="notification"
                                       @navigate="close"/>
            <follow-notification-item v-else-if="notification.notificationType == 'FOLLOW'" :notification="notification"
                                      @navigate="close"/>
            <button class="btn btn-icon btn-sm dismiss" type="button" aria-label="알림 지우기"
                    @click="deleteNotification(notification.id)">
              <app-icon name="x" :size="16"/>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { NotificationDto } from '@/api/models/notification.dtos';
import { deleteNotification, getNotifications } from '@/api/notifications';
import { HttpApiError } from '@/api/common/httpApiClient';
import CommentNotificationItem from '@/components/notifications/CommentNotificationItem.vue';
import FollowNotificationItem from '@/components/notifications/FollowNotificationItem.vue';
import AppIcon from '@/components/common/AppIcon.vue';
import blogWebSocketClient from '@/utils/websocket';
import { toast } from '@/utils/dialog';

export default defineComponent({
  name: 'NotificationListButton',
  components: { AppIcon, CommentNotificationItem, FollowNotificationItem },
  data() {
    return {
      notifications: Array<NotificationDto>(),
      cursorId: '',
      isNoMorePage: true,
      isLoading: false,
      isOpen: false,
    };
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
        .catch(() => {
          // 알림 조회 실패는 헤더 노출에 영향을 주지 않으므로 조용히 무시한다.
        });
      } finally {
        this.isLoading = false;
      }
    },
    async deleteNotification(notificationId: string) {
      await deleteNotification(notificationId)
      .then(() => {
        this.notifications = this.notifications.filter((x) => x.id !== notificationId);
      })
      .catch((error: HttpApiError) => {
        toast.error(error.getErrorMessage());
      });
    },
    async deleteAll() {
      const targets = [...this.notifications];
      await Promise.all(targets.map((notification) => deleteNotification(notification.id).catch(() => undefined)));
      await this.fetchNotifications();
    },
    onNotificationReceived(notification: NotificationDto) {
      // 이미 목록에 있는 알림이면 중복 추가하지 않는다.
      if (this.notifications.some((x) => x.id === notification.id)) {
        return;
      }
      this.notifications.unshift(notification);
    },
  },
  mounted() {
    this.fetchNotifications();
    // 이 컴포넌트는 로그인 상태에서만 렌더링되므로, 마운트 시점에 세션을 인증해
    // 실시간 알림을 수신할 수 있도록 한다. (이미 연결된 소켓의 로그인 직후 케이스 포함)
    blogWebSocketClient.authenticate();
    blogWebSocketClient.onnotification = this.onNotificationReceived;
    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('keydown', this.onKeydown);
  },
  unmounted() {
    blogWebSocketClient.onnotification = undefined;
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onKeydown);
  },
});
</script>

<style scoped>
.notifications {
  position: relative;
}

.bell {
  position: relative;
}

.count {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 0 2px var(--surface);
}

.panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 380px;
  max-width: calc(100vw - 32px);
  max-height: min(70vh, 560px);
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 200;
}

.panel-head {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 12px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-weight: 700;
}

.empty-state.compact {
  padding: var(--s-8) var(--s-4);
}

.list {
  display: grid;
}

.item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--s-2);
  padding: 12px 10px 12px 16px;
  border-bottom: 1px solid var(--border);
}

.item:last-child {
  border-bottom: none;
}

.item:hover {
  background: var(--hover-color);
}

.dismiss {
  color: var(--text-3);
}

@media (max-width: 760px) {
  .panel {
    position: fixed;
    top: calc(var(--header-height) + 4px);
    right: 12px;
    left: 12px;
    width: auto;
    max-width: none;
  }
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
