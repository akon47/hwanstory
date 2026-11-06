import { reactive } from 'vue';

// 화면 어디서나 쓰는 알림(토스트)·확인·입력 대화상자 상태.
// 브라우저 기본 alert/confirm/prompt 대신 앱 안에서 같은 모양으로 그린다. (AppDialogHost.vue 가 렌더링)

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // 되돌릴 수 없는 작업이면 확인 버튼을 빨갛게 그린다.
  danger?: boolean;
}

export interface PromptOptions extends ConfirmOptions {
  placeholder?: string;
  defaultValue?: string;
  type?: 'text' | 'password';
  multiline?: boolean;
  // 비워 둔 채 확인할 수 있는지
  allowEmpty?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

interface PromptRequest extends PromptOptions {
  resolve: (value: string | null) => void;
}

interface DialogState {
  toasts: Array<ToastItem>;
  confirm: ConfirmRequest | null;
  prompt: PromptRequest | null;
}

export const dialogState = reactive<DialogState>({
  toasts: [],
  confirm: null,
  prompt: null,
});

let nextToastId = 1;

function pushToast(kind: ToastKind, message: string, duration: number) {
  const id = nextToastId++;
  dialogState.toasts.push({ id, kind, message });
  if (dialogState.toasts.length > 4) {
    dialogState.toasts.shift();
  }
  window.setTimeout(() => dismissToast(id), duration);
}

export function dismissToast(id: number) {
  const index = dialogState.toasts.findIndex((toast) => toast.id === id);
  if (index >= 0) {
    dialogState.toasts.splice(index, 1);
  }
}

export const toast = {
  info(message: string, duration = 3200) {
    pushToast('info', message, duration);
  },
  success(message: string, duration = 3200) {
    pushToast('success', message, duration);
  },
  error(message: string, duration = 5000) {
    pushToast('error', message, duration);
  },
};

// 확인 대화상자. 확인하면 true, 취소·닫기면 false.
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const normalized = typeof options === 'string' ? { message: options } : options;
  return new Promise((resolve) => {
    dialogState.prompt = null;
    dialogState.confirm = { ...normalized, resolve };
  });
}

// 한 줄(또는 여러 줄) 입력 대화상자. 취소하면 null.
export function promptDialog(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    dialogState.confirm = null;
    dialogState.prompt = { ...options, resolve };
  });
}

export function resolveConfirm(ok: boolean) {
  const request = dialogState.confirm;
  dialogState.confirm = null;
  request?.resolve(ok);
}

export function resolvePrompt(value: string | null) {
  const request = dialogState.prompt;
  dialogState.prompt = null;
  request?.resolve(value);
}
