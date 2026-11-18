import { OpenType } from '@/api/models/blog.dtos';
import { AI_COVER_BATCH_MAX } from '@/api/models/ai.dtos';
import { formatUsd } from '@/utils/format';

// AI 일괄 작업 창(커버·제목/요약/태그)이 같이 쓰는 것들

// AiBatchDialogFrame 의 진행 상황 칸
export interface BatchProgress {
  state: 'running' | 'done' | 'stopped' | 'error';
  text: string;
  // 0~100
  percent: number;
  detail?: string;
}

// 한 요청에 보낼 수 있는 글 수 (커버·제안·적용 모두 1~100개)
export const BATCH_MAX = AI_COVER_BATCH_MAX;

// 100개씩 나눈다
export function chunked<T>(items: Array<T>, size: number = BATCH_MAX): Array<Array<T>> {
  const chunks: Array<Array<T>> = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

const OPEN_TYPE_BADGES: Record<OpenType, { label: string; className: string }> = {
  PUBLIC: { label: '공개', className: '' },
  PRIVATE: { label: '비공개', className: '' },
  DRAFT: { label: '임시저장', className: 'badge-warning' },
  SCHEDULED: { label: '예약', className: 'badge-accent' },
};

export function openTypeBadge(openType: OpenType): { label: string; className: string } {
  return OPEN_TYPE_BADGES[openType] ?? OPEN_TYPE_BADGES.PUBLIC;
}

// "약 $0.10~0.20" (글 하나 비용 범위 × 글 수)
export function costRangeText([low, high]: [number, number], count: number): string {
  return `${formatUsd(low * count)}~${formatUsd(high * count).replace('$', '')}`;
}
