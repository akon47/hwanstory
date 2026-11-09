<template>
  <div v-if="readers.length > 0" class="read-rail" aria-label="다른 사람이 읽고 있는 위치">
    <button v-for="reader in readers" :key="reader.id" class="read-dot" type="button"
            :style="{ top: `${reader.progress * 100}%`, background: reader.color }"
            :title="`${reader.name} · ${Math.round(reader.progress * 100)}% 읽는 중 (누르면 그곳으로 이동)`"
            @click="$emit('jump', reader.progress)">
      <span class="read-glyph" aria-hidden="true">{{ glyph(reader.name) }}</span>
      <span class="read-label" :style="{ background: reader.color }">{{ reader.name }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { avatarGlyph } from '@/utils/cursorIdentity';

// 같은 글을 읽는 다른 사람들이 지금 본문의 어디쯤을 읽고 있는지, 화면 오른쪽 가장자리의 세로 줄 위에 색 점으로 보여준다.
// 줄의 맨 위가 본문 시작, 맨 아래가 본문 끝이다. 점을 누르면 그 사람이 읽는 곳으로 간다.
export interface PostReader {
  id: string;
  name: string;
  color: string;
  // 본문 시작(0) ~ 끝(1)
  progress: number;
}

export default defineComponent({
  name: 'ReadPositionRail',
  props: {
    readers: {
      type: Array as PropType<Array<PostReader>>,
      default: () => [],
    },
  },
  emits: ['jump'],
  methods: {
    glyph(name: string): string {
      return avatarGlyph(name);
    },
  },
});
</script>

<style scoped>
.read-rail {
  position: fixed;
  top: calc(var(--header-height) + var(--s-6));
  bottom: var(--s-6);
  right: 14px;
  width: 2px;
  border-radius: 1px;
  background: var(--border);
  z-index: 90;
}

.read-dot {
  position: absolute;
  left: 50%;
  width: 22px;
  height: 22px;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg);
  border-radius: 50%;
  /* 배경은 사람마다 정해진 진한 색이라 테마와 상관없이 흰 글자를 쓴다 */
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: top 0.4s ease, transform var(--ease);
}

.read-dot:hover,
.read-dot:focus-visible {
  transform: translate(-50%, -50%) scale(1.2);
  z-index: 1;
}

/* 이름표는 점의 왼쪽으로 펼쳐서 화면 밖으로 나가지 않게 한다 */
.read-label {
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--ease);
}

.read-dot:hover .read-label,
.read-dot:focus-visible .read-label {
  opacity: 1;
}

/* 좁은 화면에서는 본문을 가리지 않도록 작은 점만 둔다 */
@media (max-width: 700px) {
  .read-rail {
    right: 7px;
  }

  .read-dot {
    width: 12px;
    height: 12px;
    border-width: 1px;
  }

  .read-glyph {
    display: none;
  }
}
</style>
