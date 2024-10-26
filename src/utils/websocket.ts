import {
  MessageDto,
} from '@/api/models/blog.dtos';
import SockJS from 'sockjs-client';

class BlogWebSocketClient {
  public sessionCount: number;

  private socket: WebSocket;

  constructor() {
    this.sessionCount = 0;
    this.socket = new SockJS(process.env.VUE_APP_WEBSOCKET_URI);
    this.socket.onopen = () => {
      console.log('socket: onopen');
    };
    this.socket.onclose = () => {
      console.log('socket: onclose');
    };
    this.socket.onerror = () => {
      console.log('socket: onerror');
    };
    this.socket.onmessage = async (ev) => {
      const message: MessageDto = JSON.parse(ev.data);
      console.log(message.type);
      switch (message.type) {
        case "SESSION_COUNT_CHANGED": {
          this.sessionCount = message.payload as number;
          if (this.onsessioncountchanged) {
            this.onsessioncountchanged(this.sessionCount);
          }
          console.log(`sessionCount: ${this.sessionCount}`);
          break;
        }
      }
    };
  }

  public onsessioncountchanged: { (count: number): void } | undefined;
}

const blogWebSocketClient = new BlogWebSocketClient();
export default blogWebSocketClient;