import {
  MessageDto,
  PostViewerCountDto,
} from '@/api/models/blog.dtos';
import { NotificationDto } from '@/api/models/notification.dtos';
import { getAccessTokenFromLocalStorage } from '@/utils/storage';
import SockJS from 'sockjs-client';

// 재연결 백오프(ms): 최초 지연부터 시작해 실패할 때마다 2배씩, 최대 지연까지 증가
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

class BlogWebSocketClient {
  // 전체 접속 세션 수
  public sessionCount: number;
  // 게시글 Id별 현재 시청자 수
  public postViewerCounts: Record<string, number>;

  private socket!: WebSocket;
  // 현재 보고 있는(상세 페이지) 게시글 Id
  private viewingPostId: string | null;
  // 시청자 수를 구독 중인 게시글 Id 집합 (재연결 시 재요청을 위해 보관)
  private readonly watchedPostIds: Set<string>;

  // 다음 재연결까지의 지연(ms)과 예약된 타이머
  private reconnectDelay: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null;

  constructor() {
    this.sessionCount = 0;
    this.postViewerCounts = {};
    this.viewingPostId = null;
    this.watchedPostIds = new Set<string>();
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    this.reconnectTimer = null;

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
        this.sendMessage('VIEW_POST', this.viewingPostId);
      }
      if (this.watchedPostIds.size > 0) {
        this.sendMessage('WATCH_POSTS', Array.from(this.watchedPostIds));
      }
    };
    socket.onclose = () => {
      // 연결이 끊기면 시청자 수는 더 이상 신뢰할 수 없으므로 초기화하고, 재연결을 예약한다.
      this.postViewerCounts = {};
      this.onpostviewercountschanged?.();
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

  // 현재 보고 있는 게시글을 서버에 알린다. (상세 페이지 진입 시 postId, 이탈 시 null)
  public viewPost(postId: string | null) {
    if (this.viewingPostId === postId) {
      return;
    }
    this.viewingPostId = postId;
    // 연결이 끊겨 있으면 재연결 시 onopen에서 현재 상태가 다시 전송된다.
    this.sendMessage('VIEW_POST', postId);
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
  public onnotification: { (notification: NotificationDto): void } | undefined;
}

const blogWebSocketClient = new BlogWebSocketClient();
export default blogWebSocketClient;
