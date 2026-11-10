<template>
  <div class="floating-reactions" aria-hidden="true">
    <span v-for="burst in bursts" :key="burst.key" class="burst" :style="{ left: `${burst.left}%`, animationDuration: `${burst.duration}ms` }">
      {{ burst.emoji }}
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// 같은 글을 읽는 누군가가 반응 이모지를 누르면, 화면 아래에서 그 이모지가 떠올랐다 사라진다.
// PostView 가 웹소켓에서 받은 신호마다 add(emoji) 를 부른다. 한꺼번에 많이 와도 화면에는 일정 개수까지만 띄운다.
const MAX_ON_SCREEN = 24;

interface Burst {
  key: number;
  emoji: string;
  left: number;
  duration: number;
}

export default defineComponent({
  name: 'FloatingReactions',
  data() {
    return {
      bursts: [] as Array<Burst>,
      nextKey: 1,
      timers: [] as Array<ReturnType<typeof setTimeout>>,
    };
  },
  methods: {
    add(emoji: string) {
      if (this.bursts.length >= MAX_ON_SCREEN) {
        return;
      }
      const key = this.nextKey++;
      const duration = 2200 + Math.round(Math.random() * 800);
      // 본문 폭 안에서 조금씩 다른 자리에 띄운다.
      this.bursts.push({ key, emoji, left: 30 + Math.random() * 40, duration });
      this.timers.push(setTimeout(() => {
        this.bursts = this.bursts.filter((burst) => burst.key !== key);
      }, duration));
    },
  },
  beforeUnmount() {
    this.timers.forEach((timer) => clearTimeout(timer));
  },
});
</script>

<style scoped>
.floating-reactions {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 95;
}

.burst {
  position: absolute;
  bottom: 8%;
  font-size: 34px;
  line-height: 1;
  animation-name: float-up;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
  will-change: transform, opacity;
}

@keyframes float-up {
  0% {
    transform: translate(-50%, 0) scale(0.6);
    opacity: 0;
  }
  15% {
    transform: translate(-50%, -6vh) scale(1.15);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -55vh) scale(1);
    opacity: 0;
  }
}

/* 움직임을 줄이도록 설정한 사람에게는 제자리에서 잠깐 보였다 사라지게 한다 */
@media (prefers-reduced-motion: reduce) {
  .burst {
    animation-name: fade-only;
  }

  @keyframes fade-only {
    0%, 100% {
      opacity: 0;
    }
    20%, 70% {
      opacity: 1;
    }
  }
}
</style>
