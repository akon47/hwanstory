<template>
  <div v-if="isEnabled" class="live-cursors" aria-hidden="true">
    <!-- 다른 사람들의 커서 -->
    <div v-for="cursor in others" :key="cursor.id" class="cursor" :style="cursorStyle(cursor)">
      <svg class="cursor-arrow" width="18" height="18" viewBox="0 0 24 24">
        <path d="M5 3l14 8.5-6.2 1.4L9.6 19 5 3z" :fill="cursor.color" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      <span class="cursor-label" :style="{ background: cursor.color }">{{ cursor.name }}</span>
      <span v-if="cursor.message && isFresh(cursor)" class="cursor-bubble" :style="{ borderColor: cursor.color }">{{ cursor.message }}</span>
    </div>

    <!-- 내 말풍선 입력 (/ 키) -->
    <div v-if="isChatOpen || myMessage" class="cursor me" :style="myStyle">
      <span class="cursor-label" :style="{ background: identity.color }">{{ identity.name }}</span>
      <input v-if="isChatOpen" ref="chat-input" class="cursor-input" :style="{ borderColor: identity.color }" v-model="draft"
             maxlength="120" placeholder="한마디 (Enter 보내기 · Esc 닫기)" autocomplete="off"
             @input="onDraftInput" @keydown.enter.prevent="sendDraft" @keydown.esc.prevent="closeChat" @blur="closeChat"/>
      <span v-else-if="myMessage" class="cursor-bubble" :style="{ borderColor: identity.color }">{{ myMessage }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, PropType } from 'vue';
import blogWebSocketClient from '@/utils/websocket';
import { CursorBatchDto, CursorStateDto } from '@/api/models/blog.dtos';
import { CursorIdentity, getCursorIdentity } from '@/utils/cursorIdentity';

// 같은 글을 읽는 사람들의 마우스 커서를 글 본문 위에 겹쳐 보여준다. (Figma 의 멀티플레이어 커서처럼)
// 위치는 본문 컨테이너 기준 비율(0~1)로 주고받아 창 크기가 달라도 비슷한 자리에 놓인다.
// 마우스가 있는 기기에서만 켜지고, 서버가 사람이 너무 많다고 알리면(disabled) 조용히 꺼진다.
const MOVE_INTERVAL = 50;
const MESSAGE_TTL = 8000;
const IDLE_HIDE = 90000;

export default defineComponent({
  name: 'LiveCursors',
  props: {
    postId: {
      type: String,
      required: true,
    },
    // 좌표 기준이 되는 본문 컨테이너 (position: relative 여야 한다)
    container: {
      type: Object as PropType<HTMLElement | null>,
      default: null,
    },
  },
  data() {
    return {
      isEnabled: false,
      cursors: {} as Record<string, CursorStateDto>,
      identity: { name: '', color: '#3b5bdb' } as CursorIdentity,
      selfId: null as string | null,
      lastSentAt: 0,
      lastSent: { x: -1, y: -1 },
      myX: 0.5,
      myY: 0,
      isChatOpen: false,
      draft: '',
      myMessage: '',
      myMessageTimer: null as ReturnType<typeof setTimeout> | null,
      tick: 0,
      tickTimer: null as ReturnType<typeof setInterval> | null,
    };
  },
  computed: {
    others(): Array<CursorStateDto> {
      const now = Date.now() + this.tick * 0;
      return Object.values(this.cursors).filter((cursor) => cursor.id !== this.selfId && now - cursor.updatedAt < IDLE_HIDE);
    },
    myStyle() {
      return { left: `${this.myX * 100}%`, top: `${this.myY * 100}%` };
    },
  },
  watch: {
    postId() {
      this.cursors = {};
    },
    container(element: HTMLElement | null, previous: HTMLElement | null) {
      if (previous) {
        previous.removeEventListener('mousemove', this.onMouseMove);
        previous.removeEventListener('mouseleave', this.onMouseLeave);
      }
      if (element) {
        element.addEventListener('mousemove', this.onMouseMove, { passive: true });
        element.addEventListener('mouseleave', this.onMouseLeave);
      }
    },
  },
  methods: {
    cursorStyle(cursor: CursorStateDto) {
      return { left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` };
    },
    isFresh(cursor: CursorStateDto): boolean {
      return Date.now() + this.tick * 0 - cursor.messageAt < MESSAGE_TTL;
    },
    relativePosition(event: MouseEvent): { x: number; y: number } | null {
      if (!this.container) {
        return null;
      }
      const rect = this.container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }
      const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      return { x, y };
    },
    onMouseMove(event: MouseEvent) {
      const position = this.relativePosition(event);
      if (!position) {
        return;
      }
      this.myX = position.x;
      this.myY = position.y;
      const now = Date.now();
      if (now - this.lastSentAt < MOVE_INTERVAL) {
        return;
      }
      if (Math.abs(position.x - this.lastSent.x) < 0.002 && Math.abs(position.y - this.lastSent.y) < 0.002) {
        return;
      }
      this.lastSentAt = now;
      this.lastSent = position;
      blogWebSocketClient.sendCursor(position.x, position.y, this.identity.name, this.identity.color);
    },
    onMouseLeave() {
      // 본문 밖으로 나가면 더 보내지 않는다. 서버는 잠시 뒤 마지막 위치를 그대로 두다가 오래되면 지운다.
    },
    onBatch(batch: CursorBatchDto) {
      if (batch.postId !== this.postId) {
        return;
      }
      if (batch.disabled) {
        this.cursors = {};
        return;
      }
      const next = { ...this.cursors };
      batch.left.forEach((id) => delete next[id]);
      batch.cursors.forEach((cursor) => {
        next[cursor.id] = cursor;
      });
      this.cursors = next;
    },
    onSelf(sessionId: string) {
      this.selfId = sessionId;
    },
    onKeydown(event: KeyboardEvent) {
      if (!this.isEnabled || event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (event.key === '/' && !typing && !this.isChatOpen && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        this.openChat();
      }
    },
    openChat() {
      this.isChatOpen = true;
      this.draft = '';
      nextTick(() => (this.$refs['chat-input'] as HTMLInputElement | undefined)?.focus());
    },
    closeChat() {
      if (!this.isChatOpen) {
        return;
      }
      this.isChatOpen = false;
      this.draft = '';
      if (!this.myMessage) {
        blogWebSocketClient.sendCursorChat('');
      }
    },
    onDraftInput() {
      // 치는 동안에도 상대에게 바로 보인다 (Figma 처럼). 서버가 150ms 로 묶는다.
      blogWebSocketClient.sendCursorChat(this.draft);
    },
    sendDraft() {
      const message = this.draft.trim();
      this.isChatOpen = false;
      this.draft = '';
      if (!message) {
        blogWebSocketClient.sendCursorChat('');
        return;
      }
      blogWebSocketClient.sendCursorChat(message);
      this.myMessage = message;
      if (this.myMessageTimer) {
        clearTimeout(this.myMessageTimer);
      }
      this.myMessageTimer = setTimeout(() => {
        this.myMessage = '';
        blogWebSocketClient.sendCursorChat('');
      }, MESSAGE_TTL);
    },
  },
  mounted() {
    // 마우스가 있는 기기에서만 켠다 (터치 기기는 커서가 없다).
    this.isEnabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!this.isEnabled) {
      return;
    }
    this.identity = getCursorIdentity();
    this.selfId = blogWebSocketClient.sessionId;
    blogWebSocketClient.oncursorbatch = this.onBatch;
    blogWebSocketClient.oncursorself = this.onSelf;
    window.addEventListener('keydown', this.onKeydown);
    if (this.container) {
      this.container.addEventListener('mousemove', this.onMouseMove, { passive: true });
      this.container.addEventListener('mouseleave', this.onMouseLeave);
    }
    // 말풍선 만료·오래된 커서 숨김을 위해 1초마다 다시 그린다.
    this.tickTimer = setInterval(() => {
      this.tick += 1;
    }, 1000);
  },
  beforeUnmount() {
    if (blogWebSocketClient.oncursorbatch === this.onBatch) {
      blogWebSocketClient.oncursorbatch = undefined;
    }
    if (blogWebSocketClient.oncursorself === this.onSelf) {
      blogWebSocketClient.oncursorself = undefined;
    }
    window.removeEventListener('keydown', this.onKeydown);
    if (this.container) {
      this.container.removeEventListener('mousemove', this.onMouseMove);
      this.container.removeEventListener('mouseleave', this.onMouseLeave);
    }
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }
    if (this.myMessageTimer) {
      clearTimeout(this.myMessageTimer);
    }
  },
});
</script>

<style scoped>
.live-cursors {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  overflow: visible;
}

.cursor {
  position: absolute;
  transform: translate(-2px, -2px);
  transition: left 0.12s linear, top 0.12s linear;
  will-change: left, top;
  display: grid;
  grid-template-columns: auto;
  justify-items: start;
  gap: 2px;
}

.cursor.me {
  transition: none;
}

.cursor-arrow {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
}

.cursor-label {
  margin-left: 14px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.cursor.me .cursor-label {
  margin-left: 0;
  transform: translate(12px, 14px);
}

.cursor-bubble {
  margin-left: 14px;
  max-width: 260px;
  padding: 6px 10px;
  border-radius: 12px;
  border: 2px solid;
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-sm);
  line-height: 1.45;
  word-break: keep-all;
  overflow-wrap: anywhere;
  box-shadow: var(--shadow-md);
}

.cursor.me .cursor-bubble {
  margin-left: 0;
  transform: translate(12px, 16px);
}

.cursor-input {
  pointer-events: auto;
  transform: translate(12px, 16px);
  width: 260px;
  padding: 6px 10px;
  border-radius: 12px;
  border: 2px solid;
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-sm);
  outline: none;
  box-shadow: var(--shadow-md);
}

.cursor-input::placeholder {
  color: var(--text-3);
}
</style>
