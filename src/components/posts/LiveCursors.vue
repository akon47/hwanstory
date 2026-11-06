<template>
  <div v-if="isEnabled" class="live-cursors" aria-hidden="true">
    <!-- 다른 사람들의 커서 -->
    <div v-for="cursor in others" :key="cursor.id" class="cursor" :class="{ idle: isIdle(cursor) }" :style="cursorStyle(cursor)">
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
// 위치는 본문 컨테이너 기준 비율로 주고받아 창 크기가 달라도 비슷한 자리에 놓인다. 본문 밖(좌우 여백·위아래)도 따라온다.
// 마우스가 창을 벗어나거나 탭이 숨겨지면 상대 화면에서 내 커서를 바로 지운다.
// 마우스가 있는 기기에서만 켜지고, 서버가 사람이 너무 많다고 알리면(disabled) 조용히 꺼진다.
const MOVE_INTERVAL = 50;
// 한마디 미리보기 전송 간격. 간격 안에 또 바뀌면 버리지 않고 마지막 값을 뒤따라 보낸다 (한글 조합 중 글자가 빠지지 않게)
const CHAT_INTERVAL = 120;
const MESSAGE_TTL = 8000;
// 이만큼 안 움직인 커서는 흐리게, 그 뒤로는 숨긴다
const IDLE_FADE = 15000;
const IDLE_HIDE = 60000;
// 본문 기준 비율의 허용 범위 (서버와 같다)
const X_MIN = -1.5;
const X_MAX = 2.5;
const Y_MIN = -0.5;
const Y_MAX = 1.5;

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
      lastSent: { x: -99, y: -99 },
      pendingMove: null as { x: number; y: number } | null,
      moveTimer: null as ReturnType<typeof setTimeout> | null,
      lastChatSentAt: 0,
      pendingChat: null as string | null,
      chatTimer: null as ReturnType<typeof setTimeout> | null,
      isAway: false,
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
  },
  methods: {
    cursorStyle(cursor: CursorStateDto) {
      return { left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` };
    },
    isFresh(cursor: CursorStateDto): boolean {
      return Date.now() + this.tick * 0 - cursor.messageAt < MESSAGE_TTL;
    },
    isIdle(cursor: CursorStateDto): boolean {
      return Date.now() + this.tick * 0 - cursor.updatedAt > IDLE_FADE;
    },
    relativePosition(clientX: number, clientY: number): { x: number; y: number } | null {
      if (!this.container) {
        return null;
      }
      const rect = this.container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }
      const x = Math.min(X_MAX, Math.max(X_MIN, (clientX - rect.left) / rect.width));
      const y = Math.min(Y_MAX, Math.max(Y_MIN, (clientY - rect.top) / rect.height));
      return { x, y };
    },
    onMouseMove(event: MouseEvent) {
      const position = this.relativePosition(event.clientX, event.clientY);
      if (!position) {
        return;
      }
      this.isAway = false;
      this.myX = position.x;
      this.myY = position.y;
      if (Math.abs(position.x - this.lastSent.x) < 0.002 && Math.abs(position.y - this.lastSent.y) < 0.002) {
        return;
      }
      this.pendingMove = position;
      const wait = MOVE_INTERVAL - (Date.now() - this.lastSentAt);
      if (wait <= 0) {
        this.flushMove();
      } else if (!this.moveTimer) {
        // 간격 안의 움직임은 버리지 않고 마지막 위치를 뒤따라 보낸다.
        this.moveTimer = setTimeout(() => this.flushMove(), wait);
      }
    },
    flushMove() {
      this.moveTimer = null;
      if (!this.pendingMove || this.isAway) {
        return;
      }
      this.lastSentAt = Date.now();
      this.lastSent = this.pendingMove;
      blogWebSocketClient.sendCursor(this.pendingMove.x, this.pendingMove.y, this.identity.name, this.identity.color);
      this.pendingMove = null;
    },
    // 한마디 미리보기: 간격 안에 또 바뀌면 마지막 값을 뒤따라 보낸다.
    queueChat(text: string) {
      this.pendingChat = text;
      const wait = CHAT_INTERVAL - (Date.now() - this.lastChatSentAt);
      if (wait <= 0) {
        this.flushChat();
      } else if (!this.chatTimer) {
        this.chatTimer = setTimeout(() => this.flushChat(), wait);
      }
    },
    flushChat() {
      this.chatTimer = null;
      if (this.pendingChat === null) {
        return;
      }
      this.lastChatSentAt = Date.now();
      blogWebSocketClient.sendCursorChat(this.pendingChat);
      this.pendingChat = null;
    },
    // 예약된 미리보기를 취소하고 최종 값을 바로 보낸다.
    sendChatNow(text: string) {
      if (this.chatTimer) {
        clearTimeout(this.chatTimer);
        this.chatTimer = null;
      }
      this.pendingChat = null;
      this.lastChatSentAt = Date.now();
      blogWebSocketClient.sendCursorChat(text);
    },
    // 마우스가 브라우저 창 밖으로 나가면 (relatedTarget 이 없다) 내 커서를 지운다.
    onMouseOut(event: MouseEvent) {
      if (event.relatedTarget === null) {
        this.leave();
      }
    },
    onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        this.leave();
      }
    },
    leave() {
      if (this.isAway) {
        return;
      }
      this.isAway = true;
      this.lastSent = { x: -99, y: -99 };
      this.pendingMove = null;
      if (this.moveTimer) {
        clearTimeout(this.moveTimer);
        this.moveTimer = null;
      }
      blogWebSocketClient.sendCursorLeave();
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
        this.sendChatNow('');
      }
    },
    // 입력창의 실제 값. 한글 조합(IME) 중인 글자는 v-model 에 아직 반영되지 않으므로 DOM 값을 읽는다.
    currentDraft(): string {
      const input = this.$refs['chat-input'] as HTMLInputElement | undefined;
      return (input ? input.value : this.draft) ?? '';
    },
    onDraftInput() {
      // 치는 동안에도 상대에게 바로 보인다 (Figma 처럼). 조합 중인 글자까지 담긴 DOM 값을 뒤따라 보낸다.
      this.queueChat(this.currentDraft());
    },
    sendDraft() {
      const message = this.currentDraft().trim();
      this.isChatOpen = false;
      this.draft = '';
      if (!message) {
        this.sendChatNow('');
        return;
      }
      this.sendChatNow(message);
      this.myMessage = message;
      if (this.myMessageTimer) {
        clearTimeout(this.myMessageTimer);
      }
      this.myMessageTimer = setTimeout(() => {
        this.myMessage = '';
        this.sendChatNow('');
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
    // 본문 안팎 어디서든 따라오도록 창 전체에서 마우스를 읽는다. 좌표는 본문 컨테이너 기준 비율로 바꾼다.
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    document.addEventListener('mouseout', this.onMouseOut);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('blur', this.leave);
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
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseout', this.onMouseOut);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('blur', this.leave);
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }
    if (this.myMessageTimer) {
      clearTimeout(this.myMessageTimer);
    }
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
    }
    if (this.chatTimer) {
      clearTimeout(this.chatTimer);
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
  transition: left 0.12s linear, top 0.12s linear, opacity 0.6s ease;
  will-change: left, top;
  display: grid;
  grid-template-columns: auto;
  justify-items: start;
  gap: 2px;
}

.cursor.idle {
  opacity: 0.45;
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
