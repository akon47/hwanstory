<template>
  <span v-if="viewerCount > 0" class="viewer-count" title="지금 이 글을 읽고 있는 사람 수">
    <span class="live-dot" aria-hidden="true"/>
    <app-icon name="eye" :size="14"/>{{ viewerCount }}
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import blogWebSocketClient from '@/utils/websocket';
import AppIcon from '@/components/common/AppIcon.vue';

// 특정 게시글의 실시간 시청자 수를 눈 아이콘 + 숫자로 표시하는 배지.
// 마운트 시 해당 게시글의 시청자 수 구독을 시작하고, 언마운트 시 해제한다.
export default defineComponent({
  name: 'PostViewerCount',
  components: { AppIcon },
  props: {
    postId: {
      type: String,
      default: undefined,
    },
  },
  computed: {
    viewerCount(): number {
      return store.getters['commonStore/postViewerCount'](this.postId);
    },
  },
  watch: {
    postId(newPostId: string | undefined, oldPostId: string | undefined) {
      if (oldPostId) {
        blogWebSocketClient.unwatchPost(oldPostId);
      }
      if (newPostId) {
        blogWebSocketClient.watchPost(newPostId);
      }
    },
  },
  mounted() {
    if (this.postId) {
      blogWebSocketClient.watchPost(this.postId);
    }
  },
  unmounted() {
    if (this.postId) {
      blogWebSocketClient.unwatchPost(this.postId);
    }
  },
});
</script>

<style scoped>
.viewer-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent-text);
  white-space: nowrap;
  font-weight: 600;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
</style>
