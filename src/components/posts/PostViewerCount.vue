<template>
  <span v-if="viewerCount > 0" class="viewer-count" title="지금 이 글을 보고 있는 사람 수">
    <svg class="eye-icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path fill="currentColor"
            d="M12 5c-7 0-10.5 7-10.5 7S5 19 12 19s10.5-7 10.5-7S19 5 12 5zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>
    </svg>
    {{ viewerCount }}
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';
import blogWebSocketClient from '@/utils/websocket';

// 특정 게시글의 실시간 시청자 수를 눈 아이콘 + 숫자로 표시하는 배지.
// 마운트 시 해당 게시글의 시청자 수 구독을 시작하고, 언마운트 시 해제한다.
export default defineComponent({
  name: 'PostViewerCount',
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
  gap: 0.2em;
  color: var(--link-accent-color);
  white-space: nowrap;
}

.eye-icon {
  vertical-align: middle;
}
</style>
