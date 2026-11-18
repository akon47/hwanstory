import { AiCoverDto, AiMetaDto } from '@/api/models/ai.dtos';
import { EditorSelection } from '@/components/posts/editorSelection';

// 글쓰기 폼(WritePostForm)이 AI 패널(AiWritePanel)에 넘겨 주는 조작 창구.
// 패널은 글의 상태를 직접 들고 있지 않고, 읽을 때는 snapshot(), 바꿀 때는 이 메서드들만 쓴다.

export interface AiPostSnapshot {
  readonly title: string;
  // 직접 쓴(또는 AI 가 채운) 요약, 없으면 본문 첫 문단
  readonly summary: string;
  readonly content: string;
  readonly tags: Array<string>;
  // 비어 있을 수 있다 (새 글에서 주소를 안 정한 경우)
  readonly postUrl: string;
}

export type AiMetaField = 'title' | 'summary' | 'tags' | 'postUrl';

export interface AiWriteBridge {
  readonly isNewPost: boolean;
  readonly blogId: string;

  snapshot(): AiPostSnapshot;

  // 비어 있는 칸만 채운다(제목이 비어 있으면 항상 채운다). 채운 칸을 돌려준다.
  fillEmptyMeta(meta: AiMetaDto): Array<AiMetaField>;
  // 한 칸을 제안 값으로 바꾼다 (이미 쓴 내용이 있어도)
  applyMetaField(field: AiMetaField, meta: AiMetaDto): void;
  // 지금 그 칸이 제안 값과 같은지 (패널의 [바꾸기] 버튼을 숨기는 데 쓴다)
  isMetaFieldSameAs(field: AiMetaField, meta: AiMetaDto): boolean;

  // 커버 이미지를 본문 맨 위에 넣고 썸네일로 정한다 (전에 넣은 AI 커버가 맨 위에 있으면 바꾼다)
  applyCover(cover: AiCoverDto, alt: string): void;
  // 새 글이면 공개 유형을 임시저장으로 바꾼다. 바꿨으면 true.
  markAsDraft(): boolean;

  // ---- 초안 스트리밍 ----
  hasContent(): boolean;
  // replace: 본문을 비우고 쓴다, append: 지금 본문 뒤에 이어 쓴다
  beginStream(mode: 'replace' | 'append'): void;
  // 지금까지 받은 초안 전체
  updateStream(text: string): void;
  endStream(): void;

  // ---- 다듬기 ----
  captureSelection(): EditorSelection | null;
  replaceSelection(selection: EditorSelection, text: string): boolean;

  // 본문의 첫 이미지를 복사해 다른 글(영어판)의 썸네일 첨부 Id 를 만든다 (글 저장과 같은 규칙)
  resolveThumbnailFileId(content: string): Promise<string | undefined>;
}

// AI 가 준 글 주소를 이 블로그 규칙(영문·숫자·-·_)에 맞춘다
export function normalizePostUrl(value: string | null | undefined): string {
  return (value ?? '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, '-')
  .replace(/-{2,}/g, '-')
  .replace(/^-|-$/g, '');
}
