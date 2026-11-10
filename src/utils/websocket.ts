import {
  CursorBatchDto,
  MessageDto,
  PostViewerCountDto,
  PostViewersDto,
  ReadPositionsDto,
} from '@/api/models/blog.dtos';
import { NotificationDto } from '@/api/models/notification.dtos';
import { getAccessTokenFromLocalStorage } from '@/utils/storage';
import SockJS from 'sockjs-client';

// 재연결 백오프(ms): 최초 지연부터 시작해 실패할 때마다 2배씩, 최대 지연까지 증가
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

// 생존 신호(PING) 전송 주기(ms). 서버는 일정 시간 PING이 없는 세션을 죽은 것으로 보고 수거하므로,
// 네트워크 전환(예: Wi-Fi -> LTE)으로 끊긴 옛 세션이 서버에 유령으로 남지 않게 한다.
// 서버 타임아웃(75초)보다 충분히 짧게 두어 핑 1~2회를 놓쳐도 세션이 유지되도록 한다.
const PING_INTERVAL = 25000;

class BlogWebSocketClient {
  // 전체 접속 세션 수
  public sessionCount: number;
  // 게시글 Id별 현재 시청자 수
  public postViewerCounts: Record<string, number>;

  private socket!: WebSocket;
  // 현재 보고 있는(상세 페이지) 게시글 Id
  private viewingPostId: string | null;
  // 읽는 사람 목록에 보일 내 이름·색 (재연결 시 다시 보내기 위해 보관)
  private viewingIdentity: { name: string; color: string } | null;
  // 지금 보는 글을 함께 읽고 있는 사람들 (서버가 누가 들어오거나 나갈 때마다 알려 준다)
  public postViewers: PostViewersDto | null;
  // 지금 보는 글에서 내가 읽고 있는 위치 (재연결 시 다시 보내기 위해 보관)
  private readPosition: number | null;
  // 시청자 수를 구독 중인 게시글 Id 집합 (재연결 시 재요청을 위해 보관)
  private readonly watchedPostIds: Set<string>;

  // 다음 재연결까지의 지연(ms)과 예약된 타이머
  private reconnectDelay: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null;

  // 생존 신호(PING)를 주기적으로 보내는 타이머
  private pingTimer: ReturnType<typeof setInterval> | null;

  constructor() {
    this.sessionCount = 0;
    this.postViewerCounts = {};
    this.viewingPostId = null;
    this.viewingIdentity = null;
    this.postViewers = null;
    this.readPosition = null;
    this.watchedPostIds = new Set<string>();
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    this.reconnectTimer = null;
    this.pingTimer = null;

    this.connect();
  }

  private connect() {
    this.reconnectTimer = null;

    const socket = new SockJS(process.env.VUE_APP_WEBSOCKET_URI);
    this.socket = socket;

    socket.onopen = () => {
      // 연결에 성공하면 백오프를 초기화하고, 현재 시청/구독/인증 상태를 서버에 다시 알린다.
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;
      // 로그인 상태라면 이 세션을 사용자와 연결해 실시간 알림을 받을 수 있게 한다.
      this.authenticate();
      if (this.viewingPostId) {
        this.sendViewPost();
        if (this.readPosition !== null) {
          this.sendMessage('READ_POSITION', this.readPosition);
        }
      }
      if (this.watchedPostIds.size > 0) {
        this.sendMessage('WATCH_POSTS', Array.from(this.watchedPostIds));
      }
      // 연결이 살아 있는 동안 주기적으로 생존 신호를 보낸다.
      this.startPing();
    };
    socket.onclose = () => {
      // 연결이 끊기면 시청자 수는 더 이상 신뢰할 수 없으므로 초기화하고, 재연결을 예약한다.
      this.stopPing();
      this.sessionId = null;
      this.postViewerCounts = {};
      this.onpostviewercountschanged?.();
      this.setPostViewers(null);
      this.scheduleReconnect();
    };
    socket.onerror = () => {
      // 연결 오류는 onclose 처리(재연결 예약)에 맡긴다.
    };
    socket.onmessage = (ev) => {
      const message: MessageDto = JSON.parse(ev.data);
      switch (message.type) {
        case 'SESSION_COUNT_CHANGED': {
          this.sessionCount = message.payload as number;
          this.onsessioncountchanged?.(this.sessionCount);
          break;
        }
        case 'POST_VIEWER_COUNT_CHANGED': {
          const viewerCount = message.payload as PostViewerCountDto;
          this.postViewerCounts[viewerCount.postId] = viewerCount.count;
          this.onpostviewercountschanged?.();
          break;
        }
        case 'POST_VIEWER_COUNTS': {
          const viewerCounts = message.payload as Array<PostViewerCountDto>;
          viewerCounts.forEach((viewerCount) => {
            this.postViewerCounts[viewerCount.postId] = viewerCount.count;
          });
          this.onpostviewercountschanged?.();
          break;
        }
        case 'NOTIFICATION': {
          const notification = message.payload as NotificationDto;
          this.onnotification?.(notification);
          break;
        }
        case 'CURSOR_SELF': {
          this.sessionId = message.payload as string;
          this.oncursorself?.(this.sessionId);
          break;
        }
        case 'POST_VIEWERS': {
          const viewers = message.payload as PostViewersDto;
          // 글을 옮긴 뒤 늦게 도착한 이전 글의 목록은 버린다.
          if (viewers.postId === this.viewingPostId) {
            this.setPostViewers(viewers);
          }
          break;
        }
        case 'REACTION_BURST': {
          const burst = message.payload as { postId: string; emoji: string; id: string };
          if (burst.postId === this.viewingPostId) {
            this.onreactionburst?.(burst.emoji);
          }
          break;
        }
        case 'COMMENT_TYPING': {
          const typing = message.payload as { postId: string; id: string; name: string };
          if (typing.postId === this.viewingPostId) {
            this.oncommenttyping?.(typing.id, typing.name);
          }
          break;
        }
        case 'COMMENTS_CHANGED': {
          const changed = message.payload as { postId: string };
          if (changed.postId === this.viewingPostId) {
            this.oncommentschanged?.();
          }
          break;
        }
        case 'READ_POSITIONS': {
          const positions = message.payload as ReadPositionsDto;
          if (positions.postId === this.viewingPostId) {
            this.onreadpositionschanged?.(positions);
          }
          break;
        }
        case 'CURSOR_BATCH': {
          this.oncursorbatch?.(message.payload as CursorBatchDto);
          break;
        }
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) {
      return;
    }
    const delay = this.reconnectDelay;
    // 다음 시도를 위해 지연을 2배로 늘리되 최대값으로 제한한다.
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  // 주기적으로 생존 신호(PING)를 보내기 시작한다. (중복 시작 방지를 위해 기존 타이머는 먼저 정리)
  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => this.sendMessage('PING', null), PING_INTERVAL);
  }

  // 생존 신호 전송을 중단한다.
  private stopPing() {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  // 현재 보고 있는 게시글을 서버에 알린다. (상세 페이지 진입 시 postId, 이탈 시 null)
  // identity 는 같은 글을 읽는 사람들에게 보일 내 이름·색이다.
  public viewPost(postId: string | null, identity: { name: string; color: string } | null = null) {
    if (this.viewingPostId === postId) {
      return;
    }
    this.viewingPostId = postId;
    this.viewingIdentity = postId ? identity : null;
    this.readPosition = null;
    this.setPostViewers(null);
    // 연결이 끊겨 있으면 재연결 시 onopen에서 현재 상태가 다시 전송된다.
    this.sendViewPost();
  }

  private sendViewPost() {
    if (this.viewingPostId && this.viewingIdentity) {
      this.sendMessage('VIEW_POST', { postId: this.viewingPostId, ...this.viewingIdentity });
    } else {
      this.sendMessage('VIEW_POST', this.viewingPostId);
    }
  }

  // 지금 보는 글에서 내가 읽고 있는 위치를 보낸다. (본문 시작 0 ~ 끝 1. 서버가 같은 글을 읽는 사람들에게 묶어 전달한다)
  public sendReadPosition(progress: number) {
    if (!this.viewingPostId) {
      return;
    }
    this.readPosition = progress;
    this.sendMessage('READ_POSITION', progress);
  }

  // 반응 이모지를 방금 눌렀다고 알린다. (같은 글을 읽는 사람들 화면에 이모지가 떠오른다)
  public sendReactionBurst(emoji: string) {
    if (this.viewingPostId) {
      this.sendMessage('REACTION_BURST', emoji);
    }
  }

  // 댓글을 쓰는 중이라고 알린다.
  public sendCommentTyping() {
    if (this.viewingPostId) {
      this.sendMessage('COMMENT_TYPING', null);
    }
  }

  private setPostViewers(viewers: PostViewersDto | null) {
    this.postViewers = viewers;
    this.onpostviewerschanged?.(viewers);
  }

  // 특정 게시글의 시청자 수 구독을 시작하고 현재 값을 요청한다.
  public watchPost(postId: string) {
    if (!postId || this.watchedPostIds.has(postId)) {
      return;
    }
    this.watchedPostIds.add(postId);
    this.sendMessage('WATCH_POSTS', [postId]);
  }

  // 특정 게시글의 시청자 수 구독을 해제한다.
  public unwatchPost(postId: string) {
    this.watchedPostIds.delete(postId);
  }

  // 지금 보는 글 위의 내 마우스 위치를 보낸다. (본문 영역 기준 0~1. 서버가 같은 글을 읽는 사람들에게 묶어 전달한다)
  public sendCursor(x: number, y: number, name: string, color: string) {
    this.sendMessage('CURSOR_MOVE', { x, y, name, color });
  }

  // 내 커서 옆에 띄울 짧은 말을 보낸다. 빈 문자열이면 지운다.
  public sendCursorChat(message: string) {
    this.sendMessage('CURSOR_CHAT', { message });
  }

  // 마우스가 창을 벗어났거나 탭이 숨겨졌다. 다른 사람 화면에서 내 커서를 바로 지운다.
  public sendCursorLeave() {
    this.sendMessage('CURSOR_LEAVE', null);
  }

  // 현재 로그인 토큰으로 이 세션을 사용자와 연결한다.
  // 로그인 직후(이미 연결된 소켓)와 (재)연결 시 onopen 양쪽에서 호출되어 인증을 보장한다.
  public authenticate() {
    const accessToken = getAccessTokenFromLocalStorage();
    if (accessToken) {
      this.sendMessage('AUTHENTICATE', accessToken);
    }
  }

  // 소켓이 열려 있을 때만 전송한다. 보내지 못한 상태는 viewingPostId/watchedPostIds에
  // 보존되어 있으므로 재연결 시 onopen에서 다시 전송된다.
  private sendMessage(type: string, payload: unknown) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  public onsessioncountchanged: { (count: number): void } | undefined;
  public onpostviewercountschanged: { (): void } | undefined;
  public onpostviewerschanged: { (viewers: PostViewersDto | null): void } | undefined;
  public onreadpositionschanged: { (positions: ReadPositionsDto): void } | undefined;
  public onreactionburst: { (emoji: string): void } | undefined;
  public oncommenttyping: { (sessionId: string, name: string): void } | undefined;
  public oncommentschanged: { (): void } | undefined;
  public onnotification: { (notification: NotificationDto): void } | undefined;
  // 서버가 알려준 이 세션의 Id (커서 묶음에서 내 커서를 걸러내는 데 쓴다)
  public sessionId: string | null = null;
  public oncursorself: { (sessionId: string): void } | undefined;
  public oncursorbatch: { (batch: CursorBatchDto): void } | undefined;
}

const blogWebSocketClient = new BlogWebSocketClient();
export default blogWebSocketClient;
