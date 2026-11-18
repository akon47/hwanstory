// PostEditor 의 선택 영역을 잡아 두었다가 나중에 그 자리를 바꿀 때 쓰는 정보 (AI 다듬기).
// Toast UI Editor 3.x: 마크다운 모드의 위치는 [줄, 글자](둘 다 1부터), 위지윅 모드는 ProseMirror 숫자 위치다.
export type EditorPosition = [number, number] | number;

export interface EditorSelection {
  // 고른 텍스트
  readonly text: string;
  readonly start: EditorPosition;
  readonly end: EditorPosition;
  readonly mode: 'markdown' | 'wysiwyg';
  // 앞뒤 문맥 (앞 2000자 + 표시 + 뒤 2000자)
  readonly context: string;
}

// PostEditor 가 ref 로 내주는 AI 용 메서드 (WritePostForm 이 부른다)
export interface PostEditorHandle {
  captureSelection(): EditorSelection | null;
  replaceCapturedSelection(selection: EditorSelection, text: string): boolean;
  setMarkdownQuietly(markdown: string, scroll?: 'end' | 'top' | null): void;
}

// 앞뒤 문맥 사이에 넣는 자리 표시 (서버 프롬프트에서 "여기가 고친 부분" 이라는 걸 알 수 있게)
export const SELECTION_MARK = '[다듬을 부분]';
const CONTEXT_SIDE = 2000;

// 마크다운 문자열에서 [줄, 글자] → 문자 위치
export function markdownOffsetOf(markdown: string, line: number, ch: number): number {
  let offset = 0;
  let currentLine = 1;
  while (currentLine < line) {
    const next = markdown.indexOf('\n', offset);
    if (next < 0) {
      return markdown.length;
    }
    offset = next + 1;
    currentLine += 1;
  }
  return Math.min(markdown.length, offset + Math.max(0, ch - 1));
}

export function buildSelectionContext(markdown: string, startOffset: number, endOffset: number): string {
  if (startOffset < 0 || endOffset < startOffset) {
    return '';
  }
  const before = markdown.substring(Math.max(0, startOffset - CONTEXT_SIDE), startOffset);
  const after = markdown.substring(endOffset, endOffset + CONTEXT_SIDE);
  if (!before.trim() && !after.trim()) {
    return '';
  }
  return `${before}${SELECTION_MARK}${after}`;
}
