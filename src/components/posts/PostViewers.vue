<template>
  <section v-if="total > 1" class="post-viewers" aria-label="함께 읽는 사람">
    <div class="viewers-title">함께 읽는 중 <span class="num">{{ total }}</span></div>
    <ul class="viewers-row" @mouseleave="hoveredId = null">
      <li v-for="viewer in visibleViewers" :key="viewer.id" class="viewer" :class="{ me: viewer.id === selfId }"
          :style="{ background: viewer.color }" :title="label(viewer)" tabindex="0"
          @mouseenter="hoveredId = viewer.id" @focus="hoveredId = viewer.id" @blur="hoveredId = null">
        <span aria-hidden="true">{{ glyph(viewer.name) }}</span>
        <span class="sr-only">{{ label(viewer) }}</span>
      </li>
      <li v-if="hiddenCount > 0" class="viewer more" :title="`외 ${hiddenCount}명`">+{{ hiddenCount }}</li>
    </ul>
    <div class="viewers-names subtle small" aria-hidden="true">{{ caption }}</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import blogWebSocketClient from '@/utils/websocket';
import { PostViewerDto, PostViewersDto } from '@/api/models/blog.dtos';
import { avatarGlyph } from '@/utils/cursorIdentity';

// 같은 글을 지금 읽고 있는 사람들을 동그라미로 나란히 보여준다. (문서 도구의 "함께 보는 사람" 표시처럼)
// 서버가 누가 들어오거나 나갈 때마다 목록(POST_VIEWERS)을 보내 주며, 혼자 읽는 중이면 아무것도 그리지 않는다.
const MAX_VISIBLE = 7;

export default defineComponent({
  name: 'PostViewers',
  props: {
    postId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      viewers: [] as Array<PostViewerDto>,
      total: 0,
      selfId: null as string | null,
      hoveredId: null as string | null,
    };
  },
  computed: {
    // 나를 맨 앞에 두고, 나머지는 먼저 들어온 순서대로
    orderedViewers(): Array<PostViewerDto> {
      const me = this.viewers.filter((viewer) => viewer.id === this.selfId);
      const others = this.viewers.filter((viewer) => viewer.id !== this.selfId);
      return [...me, ...others];
    },
    visibleViewers(): Array<PostViewerDto> {
      return this.orderedViewers.slice(0, MAX_VISIBLE);
    },
    hiddenCount(): number {
      return Math.max(0, this.total - this.visibleViewers.length);
    },
    // 동그라미 아래 한 줄: 가리킨 사람의 이름, 아니면 읽는 사람들 이름을 이어서
    caption(): string {
      const hovered = this.orderedViewers.find((viewer) => viewer.id === this.hoveredId);
      if (hovered) {
        return this.label(hovered);
      }
      const names = this.visibleViewers.map((viewer) => this.label(viewer)).join(', ');
      return this.hiddenCount > 0 ? `${names} 외 ${this.hiddenCount}명` : names;
    },
  },
  watch: {
    postId() {
      this.apply(blogWebSocketClient.postViewers);
    },
  },
  methods: {
    glyph(name: string): string {
      return avatarGlyph(name);
    },
    label(viewer: PostViewerDto): string {
      return viewer.id === this.selfId ? `${viewer.name} (나)` : viewer.name;
    },
    apply(payload: PostViewersDto | null) {
      this.selfId = blogWebSocketClient.sessionId;
      if (!payload || payload.postId !== this.postId) {
        this.viewers = [];
        this.total = 0;
        return;
      }
      this.viewers = payload.viewers;
      this.total = payload.total;
    },
  },
  mounted() {
    // 컴포넌트가 뜨기 전에 이미 도착한 목록이 있으면 그것부터 보여준다.
    this.apply(blogWebSocketClient.postViewers);
    blogWebSocketClient.onpostviewerschanged = this.apply;
  },
  beforeUnmount() {
    if (blogWebSocketClient.onpostviewerschanged === this.apply) {
      blogWebSocketClient.onpostviewerschanged = undefined;
    }
  },
});
</script>

<style scoped>
.post-viewers {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}

.viewers-title {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-3);
  letter-spacing: 0.06em;
}

.viewers-title .num {
  color: var(--accent-text);
}

.viewers-row {
  display: flex;
  flex-wrap: wrap;
  padding-left: 6px;
}

.viewer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-left: -6px;
  border: 2px solid var(--bg);
  border-radius: 50%;
  /* 배경은 사람마다 정해진 진한 색이라 테마와 상관없이 흰 글자를 쓴다 (LiveCursors 의 이름표와 같다) */
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 700;
  line-height: 1;
  cursor: default;
  user-select: none;
  transition: transform var(--ease);
}

.viewer:hover,
.viewer:focus-visible {
  transform: translateY(-2px);
  z-index: 1;
}

.viewer.me {
  box-shadow: 0 0 0 2px var(--accent);
}

.viewer.more {
  background: var(--surface-2);
  color: var(--text-2);
  font-size: var(--text-xs);
}

.viewers-names {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
