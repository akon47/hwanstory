import {
  MessageDto,
  PostViewerCountDto,
} from '@/api/models/blog.dtos';
import SockJS from 'sockjs-client';

class BlogWebSocketClient {
  // 전체 접속 세션 수
  public sessionCount: number;
  // 게시글 Id별 현재 시청자 수
  public postViewerCounts: Record<string, number>;

  private socket: WebSocket;
  // 소켓이 아직 열리지 않았을 때 보낼 메시지를 모아두는 버퍼
  private pendingMessages: Array<string>;
  // 현재 보고 있는(상세 페이지) 게시글 Id
  private viewingPostId: string | null;
  // 시청자 수를 구독 중인 게시글 Id 집합 (재연결 시 재요청을 위해 보관)
  private readonly watchedPostIds: Set<string>;

  constructor() {
    this.sessionCount = 0;
    this.postViewerCounts = {};
    this.pendingMessages = [];
    this.viewingPostId = null;
    this.watchedPostIds = new Set<string>();

    this.socket = new SockJS(process.env.VUE_APP_WEBSOCKET_URI);
    this.socket.onopen = () => {
      // 연결되면 현재 시청/구독 상태를 복원하고 버퍼에 쌓인 메시지를 전송한다.
      if (this.viewingPostId) {
        this.sendMessage('VIEW_POST', this.viewingPostId);
      }
      if (this.watchedPostIds.size > 0) {
        this.sendMessage('WATCH_POSTS', Array.from(this.watchedPostIds));
      }
      this.flushPendingMessages();
    };
    this.socket.onclose = () => {
      // 연결이 끊기면 시청자 수는 더 이상 신뢰할 수 없으므로 초기화한다.
      this.postViewerCounts = {};
      this.onpostviewercountschanged?.();
    };
    this.socket.onerror = () => {
      // 연결 오류는 onclose 처리에 맡긴다.
    };
    this.socket.onmessage = (ev) => {
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
      }
    };
  }

  // 현재 보고 있는 게시글을 서버에 알린다. (상세 페이지 진입 시 postId, 이탈 시 null)
  public viewPost(postId: string | null) {
    if (this.viewingPostId === postId) {
      return;
    }
    this.viewingPostId = postId;
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

  private sendMessage(type: string, payload: unknown) {
    const data = JSON.stringify({ type, payload });
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      this.pendingMessages.push(data);
    }
  }

  private flushPendingMessages() {
    const messages = this.pendingMessages;
    this.pendingMessages = [];
    messages.forEach((data) => this.socket.send(data));
  }

  public onsessioncountchanged: { (count: number): void } | undefined;
  public onpostviewercountschanged: { (): void } | undefined;
}

const blogWebSocketClient = new BlogWebSocketClient();
export default blogWebSocketClient;
