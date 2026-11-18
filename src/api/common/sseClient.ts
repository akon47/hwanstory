import { apiBaseUrl, getAuthorizationHeader, handleUnauthorizedResponse, HttpApiError } from '@/api/common/httpApiClient';

// POST 로 보내고 text/event-stream 으로 받는 스트리밍 클라이언트 (AI 글쓰기).
// EventSource 는 GET 만 되고 헤더를 못 붙여서 fetch + ReadableStream 으로 직접 읽는다.
//  - 이벤트: `event: <이름>` + `data: <JSON>` 줄들, 빈 줄로 끝난다. `:` 로 시작하는 줄(`: ping`)은 무시한다.
//  - 스트림 시작 전 오류(2xx 가 아님)는 보통 JSON 오류({name, message})라서 그 message 를 그대로 넘긴다.
//  - 401(토큰 만료)은 axios 클라이언트와 같은 처리(handleUnauthorizedResponse)로 토큰을 재발급해 한 번만 다시 보낸다.

const DEFAULT_ERROR_MESSAGE = '서비스에 잠깐 문제가 생겼어요. 잠시 뒤 다시 해 주세요.';
const NETWORK_ERROR_MESSAGE = '서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 해 주세요.';
const CUT_OFF_MESSAGE = '응답이 중간에 끊겼어요. 다시 해 주세요.';

export interface SseHandlers<D> {
  // event: status — 진행 상황 한 줄
  onStatus?: (message: string) => void;
  // event: delta — 본문 조각
  onDelta?: (text: string) => void;
  // event: done — 끝 (사용량·출처 등)
  onDone?: (done: D) => void;
  // 스트림 전/도중 오류. 사용자가 멈춘(abort) 경우에는 부르지 않는다.
  onError?: (error: HttpApiError) => void;
}

export interface SseStream {
  // 멈추기 (서버도 연결이 끊긴 걸 보고 Anthropic 스트림을 닫는다)
  abort(): void;
  // 끝나면(완료·오류·멈춤 모두) resolve
  readonly finished: Promise<void>;
}

// fetch 기반 오류. axios 쪽 HttpApiError 와 같은 모양이라 화면에서는 error.getErrorMessage() 만 쓰면 된다.
export class StreamApiError implements HttpApiError {
  public readonly name = 'HttpApiError';
  public readonly message: string;

  public constructor(
    public readonly statusCode: number | undefined,
    public readonly serverErrorCode: string | undefined,
    public readonly serverErrorMessage: string | undefined,
    public readonly statusText?: string,
  ) {
    this.message = serverErrorMessage ?? DEFAULT_ERROR_MESSAGE;
  }

  public getErrorMessage(defaultErrorMessage: string = DEFAULT_ERROR_MESSAGE): string {
    return this.serverErrorMessage || defaultErrorMessage;
  }

  public isUnauthorized = () => this.statusCode == 401;

  public isForbidden = () => this.statusCode == 403;

  public isNotFound = () => this.statusCode == 404;

  public isConflict = () => this.statusCode == 409;
}

// 오류 코드 비교용 (서버 JSON 오류의 name 은 소문자, SSE error 이벤트의 code 는 대문자라 대문자로 맞춘다)
export function errorCodeOf(error: unknown): string {
  const code = (error as HttpApiError | undefined)?.serverErrorCode;
  return code ? code.toUpperCase() : '';
}

async function readErrorResponse(response: Response): Promise<StreamApiError> {
  let name: string | undefined;
  let message: string | undefined;
  try {
    const body = await response.json();
    name = body?.name ?? body?.code;
    message = typeof body?.message === 'string' ? body.message : undefined;
  } catch (e) {
    // JSON 이 아니면 기본 문구를 쓴다.
  }
  return new StreamApiError(response.status, name, message, response.statusText);
}

function parseJson<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return null;
  }
}

export function postEventStream<D>(uri: string, body: unknown, handlers: SseHandlers<D>): SseStream {
  const controller = new AbortController();
  let settled = false;

  const fail = (error: HttpApiError) => {
    if (settled || controller.signal.aborted) {
      return;
    }
    settled = true;
    handlers.onError?.(error);
  };

  const dispatch = (event: string, data: string) => {
    if (settled) {
      return;
    }
    if (event === 'status') {
      const payload = parseJson<{ message?: string }>(data);
      if (payload?.message) {
        handlers.onStatus?.(payload.message);
      }
    } else if (event === 'delta') {
      const payload = parseJson<{ text?: string }>(data);
      if (payload?.text) {
        handlers.onDelta?.(payload.text);
      }
    } else if (event === 'done') {
      const payload = parseJson<D>(data);
      if (!payload) {
        fail(new StreamApiError(200, undefined, CUT_OFF_MESSAGE));
        return;
      }
      settled = true;
      handlers.onDone?.(payload);
    } else if (event === 'error') {
      const payload = parseJson<{ code?: string; message?: string }>(data);
      fail(new StreamApiError(200, payload?.code, payload?.message ?? DEFAULT_ERROR_MESSAGE));
    }
  };

  const readStream = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      fail(new StreamApiError(response.status, undefined, CUT_OFF_MESSAGE));
      return;
    }
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let eventName = '';
    let dataLines: Array<string> = [];

    const handleLine = (line: string) => {
      if (line === '') {
        // 빈 줄 = 이벤트 끝
        if (dataLines.length > 0) {
          dispatch(eventName || 'message', dataLines.join('\n'));
        }
        eventName = '';
        dataLines = [];
        return;
      }
      if (line.startsWith(':')) {
        // 주석(: ping)
        return;
      }
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.substring(0, colon);
      let value = colon < 0 ? '' : line.substring(colon + 1);
      if (value.startsWith(' ')) {
        value = value.substring(1);
      }
      if (field === 'event') {
        eventName = value;
      } else if (field === 'data') {
        dataLines.push(value);
      }
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      let text = buffer + decoder.decode(value, { stream: true });
      // \r\n, \n, \r 모두 줄 끝으로 본다. 마지막 조각(줄이 안 끝난 것)은 다음 읽기로 미룬다.
      // 끝이 \r 이면 다음 조각이 \n 으로 시작할 수 있으니(\r\n 이 둘로 나뉨) \r 도 같이 미룬다.
      let pendingCr = '';
      if (text.endsWith('\r')) {
        pendingCr = '\r';
        text = text.substring(0, text.length - 1);
      }
      const lines = text.split(/\r\n|\n|\r/);
      buffer = (lines.pop() ?? '') + pendingCr;
      for (const line of lines) {
        handleLine(line);
        if (settled) {
          break;
        }
      }
      if (settled) {
        reader.cancel().catch(() => undefined);
        return;
      }
    }
    buffer = (buffer + decoder.decode()).replace(/\r$/, '');
    if (buffer) {
      handleLine(buffer);
    }
    handleLine('');
    if (!settled) {
      fail(new StreamApiError(200, undefined, CUT_OFF_MESSAGE));
    }
  };

  const run = async (attempt: number): Promise<void> => {
    const response = await fetch(`${apiBaseUrl}${uri.replace(/^\//, '')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': getAuthorizationHeader(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (response.status === 401) {
      const error = await readErrorResponse(response);
      if (await handleUnauthorizedResponse(error.serverErrorCode, attempt > 0)) {
        return run(attempt + 1);
      }
      fail(error);
      return;
    }
    if (!response.ok) {
      fail(await readErrorResponse(response));
      return;
    }
    await readStream(response);
  };

  const finished = run(0).catch((error: Error) => {
    if (controller.signal.aborted || error?.name === 'AbortError') {
      return;
    }
    fail(new StreamApiError(undefined, undefined, NETWORK_ERROR_MESSAGE));
  });

  return {
    abort() {
      controller.abort();
    },
    finished,
  };
}
