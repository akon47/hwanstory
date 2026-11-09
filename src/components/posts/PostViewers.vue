<template>
  <section v-if="total > 1" class="post-viewers" aria-label="함께 읽는 사람">
    <div class="viewers-title">함께 읽는 중 <span class="num">{{ total }}</span></div>
    <ul class="viewers-row" @mouseleave="hoveredId = null">
      <li v-for="viewer in visibleViewers" :key="viewer.id" class="viewer"
          :class="{ me: viewer.id === selfId, jumpable: canJump(viewer) }"
          :style="{ background: viewer.color }" :title="hint(viewer)" tabindex="0"
          @mouseenter="hoveredId = viewer.id" @focus="hoveredId = viewer.id" @blur="hoveredId = null"
          @click="jump(viewer)" @keydown.enter.prevent="jump(viewer)">
        <span aria-hidden="true">{{ glyph(viewer.name) }}</span>
        <span class="sr-only">{{ hint(viewer) }}</span>
      </li>
      <li v-if="hiddenCount > 0" class="viewer more" :title="`외 ${hiddenCount}명`">+{{ hiddenCount }}</li>
    </ul>
    <div class="viewers-names subtle small" aria-hidden="true">{{ caption }}</div>
  </section>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { PostViewerDto } from '@/api/models/blog.dtos';
import { avatarGlyph } from '@/utils/cursorIdentity';

// 같은 글을 지금 읽고 있는 사람들을 동그라미로 나란히 보여준다. (문서 도구의 "함께 보는 사람" 표시처럼)
// 목록과 읽는 위치는 PostView 가 웹소켓에서 받아 내려 준다. 혼자 읽는 중이면 아무것도 그리지 않는다.
// 다른 사람의 동그라미를 누르면 그 사람이 읽고 있는 곳으로 가도록 jump 이벤트를 올린다.
const MAX_VISIBLE = 7;

export default defineComponent({
  name: 'PostViewers',
  props: {
    viewers: {
      type: Array as PropType<Array<PostViewerDto>>,
      default: () => [],
    },
    // 전체 읽는 사람 수 (viewers 에 다 담기지 않았을 수 있다)
    total: {
      type: Number,
      default: 0,
    },
    // 내 세션 Id
    selfId: {
      type: String as PropType<string | null>,
      default: null,
    },
    // 세션 Id -> 읽는 위치(본문 시작 0 ~ 끝 1)
    positions: {
      type: Object as PropType<Record<string, number>>,
      default: () => ({}),
    },
  },
  emits: ['jump'],
  data() {
    return {
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
    // 동그라미 아래 한 줄: 가리킨 사람의 이름(과 읽는 위치), 아니면 읽는 사람들 이름을 이어서
    caption(): string {
      const hovered = this.orderedViewers.find((viewer) => viewer.id === this.hoveredId);
      if (hovered) {
        return this.hint(hovered);
      }
      const names = this.visibleViewers.map((viewer) => this.label(viewer)).join(', ');
      return this.hiddenCount > 0 ? `${names} 외 ${this.hiddenCount}명` : names;
    },
  },
  methods: {
    glyph(name: string): string {
      return avatarGlyph(name);
    },
    label(viewer: PostViewerDto): string {
      return viewer.id === this.selfId ? `${viewer.name} (나)` : viewer.name;
    },
    canJump(viewer: PostViewerDto): boolean {
      return viewer.id !== this.selfId && this.positions[viewer.id] !== undefined;
    },
    hint(viewer: PostViewerDto): string {
      if (!this.canJump(viewer)) {
        return this.label(viewer);
      }
      return `${viewer.name} · ${Math.round(this.positions[viewer.id] * 100)}% 읽는 중`;
    },
    jump(viewer: PostViewerDto) {
      if (this.canJump(viewer)) {
        this.$emit('jump', this.positions[viewer.id]);
      }
    },
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

.viewer.jumpable {
  cursor: pointer;
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
