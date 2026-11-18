import DataTransferObject from '@/api/models/common.dtos';
import { OpenType } from '@/api/models/blog.dtos';

// AI 글쓰기 (회원 자신의 Anthropic API 키로 초안·다듬기·요약/태그·커버·영어판). 계약: /api/v1/ai/**

// 고를 수 있는 모델
export interface AiModelDto extends DataTransferObject {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  // 100만 토큰당 USD
  readonly inputPerMTok: number;
  readonly outputPerMTok: number;
}

// 이번 달 사용량
export interface AiUsageSummaryDto extends DataTransferObject {
  // yyyy-MM
  readonly month: string;
  readonly costUsd: number;
  readonly requests: number;
}

// 문체 프로필
export interface AiStyleDto extends DataTransferObject {
  readonly analyzed: boolean;
  readonly analyzedAt: string | null;
  // 분석에 쓴 글 수
  readonly postCount: number;
  readonly profile: string | null;
}

// AI 설정 (키 원문은 내려오지 않고 끝 4자리만)
export interface AiSettingsDto extends DataTransferObject {
  // 서버에 기능이 켜져 있는지 (false 면 안내만)
  readonly available: boolean;
  // 이 회원이 키를 등록했는지
  readonly configured: boolean;
  readonly keyLast4: string | null;
  readonly model: string;
  readonly monthlyLimitUsd: number;
  readonly usage: AiUsageSummaryDto;
  readonly style: AiStyleDto;
  readonly models: Array<AiModelDto>;
}

// AI 설정 저장 (apiKey 가 없거나 null 이면 기존 키 유지)
export interface AiSettingsRequestDto extends DataTransferObject {
  readonly apiKey?: string | null;
  readonly model: string;
  readonly monthlyLimitUsd: number;
}

export type AiDraftLength = 'short' | 'medium' | 'long';

// 초안 쓰기 (SSE)
export interface AiDraftRequestDto extends DataTransferObject {
  // 무엇에 대해 쓸지
  readonly request: string;
  // 메모·개요 (선택)
  readonly notes?: string;
  readonly length: AiDraftLength;
  // 웹에서 최신 자료 찾기
  readonly webResearch: boolean;
}

export type AiRewriteInstruction = 'polish' | 'expand' | 'shorten' | 'fix' | 'custom';

// 다듬기 (SSE)
export interface AiRewriteRequestDto extends DataTransferObject {
  // 선택한 부분
  readonly text: string;
  readonly instruction: AiRewriteInstruction;
  // instruction 이 custom 일 때
  readonly customInstruction?: string;
  // 앞뒤 문맥 (선택, 4000자 이내)
  readonly context?: string;
}

// 제목·요약·태그·주소 만들기
export interface AiMetaRequestDto extends DataTransferObject {
  readonly title?: string;
  readonly content: string;
}

export interface AiMetaDto extends DataTransferObject {
  readonly title: string;
  readonly summary: string;
  readonly tags: Array<string>;
  readonly postUrl: string;
}

// 영어판 (SSE)
export interface AiTranslateRequestDto extends DataTransferObject {
  readonly title: string;
  readonly summary: string;
  readonly content: string;
}

// 커버 이미지 만들기 (1200×630 PNG 를 첨부로 저장)
export interface AiCoverRequestDto extends DataTransferObject {
  readonly title: string;
  readonly summary: string;
  readonly tags: Array<string>;
}

export interface AiCoverDto extends DataTransferObject {
  // 첨부 Id (썸네일 thumbnailFileId 로 그대로 쓴다)
  readonly fileId: string;
  // 업로드 API 와 같은 형식의 경로 (절대 주소는 attachmentFileBaseUrl + url)
  readonly url: string;
}

// 커버(썸네일) 없는 내 글 (최신 글부터, 최대 500개)
export interface AiMissingCoverPostDto extends DataTransferObject {
  readonly postUrl: string;
  readonly title: string;
  readonly openType: OpenType;
  readonly createdAt: string;
}

export interface AiMissingCoversDto extends DataTransferObject {
  // 커버 없는 글 전체 수 (posts 는 최대 500개까지)
  readonly total: number;
  readonly posts: Array<AiMissingCoverPostDto>;
}

// 커버 일괄 만들기 (SSE, 한 번에 1~100개)
export interface AiCoverBatchRequestDto extends DataTransferObject {
  readonly postUrls: Array<string>;
  // 그 글의 썸네일로 지정
  readonly useAsThumbnail: boolean;
  // 본문 맨 앞에 이미지 한 줄을 넣는다 (글 본문·수정일이 바뀐다)
  readonly insertIntoContent: boolean;
}

// 제목·요약·태그 한꺼번에 채우기: 후보 (태그가 없거나 요약이 40자 미만인 내 글, 최신 글부터, 최대 500개)
export interface AiMetaCandidatePostDto extends DataTransferObject {
  readonly postUrl: string;
  readonly title: string;
  readonly openType: OpenType;
  readonly createdAt: string;
  readonly summary: string;
  readonly tags: Array<string>;
  readonly noTags: boolean;
  readonly shortSummary: boolean;
}

export interface AiMetaCandidatesDto extends DataTransferObject {
  readonly total: number;
  readonly posts: Array<AiMetaCandidatePostDto>;
}

export type AiMetaBatchField = 'title' | 'summary' | 'tags';

// 제안 받기 (SSE, 한 번에 1~100개). 글은 바꾸지 않는다.
export interface AiMetaBatchRequestDto extends DataTransferObject {
  readonly postUrls: Array<string>;
  readonly fields: Array<AiMetaBatchField>;
}

export interface AiMetaValuesDto {
  readonly title: string;
  readonly summary: string;
  readonly tags: Array<string>;
}

// 고른 제안 적용 (한 번에 1~100개). 온 필드만 바꾼다.
export interface AiMetaApplyItemDto extends DataTransferObject {
  readonly postUrl: string;
  readonly title?: string;
  readonly summary?: string;
  readonly tags?: Array<string>;
}

export interface AiMetaApplyRequestDto extends DataTransferObject {
  readonly items: Array<AiMetaApplyItemDto>;
}

export interface AiMetaApplyResultDto extends DataTransferObject {
  readonly applied: number;
  readonly failed: Array<{ postUrl: string; message: string }>;
}

// ---- 스트리밍(SSE) 이벤트 ----

export interface AiSourceDto {
  readonly title: string;
  readonly url: string;
}

export interface AiTokenUsageDto {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
}

// event: done
export interface AiDoneEventDto {
  readonly stopReason: string;
  readonly usage: AiTokenUsageDto;
  readonly sources?: Array<AiSourceDto>;
}

// 영어판 done 에는 영어 제목·요약이 더 온다.
export interface AiTranslateDoneEventDto extends AiDoneEventDto {
  readonly title: string;
  readonly summary: string;
}

// 커버 일괄 만들기 event: item (글 하나 끝날 때마다)
export interface AiCoverBatchItemEventDto {
  readonly postUrl: string;
  readonly title: string;
  // false 면 실패 (message 에 이유)
  readonly ok: boolean;
  // true 면 건너뜀 (message 에 이유)
  readonly skipped?: boolean;
  readonly fileId?: string;
  // 첨부 경로 (절대 주소는 attachmentFileBaseUrl + url)
  readonly url?: string;
  readonly message?: string;
}

// 커버 일괄 만들기 event: done
export interface AiCoverBatchDoneEventDto {
  readonly total: number;
  readonly created: number;
  readonly skipped: number;
  readonly failed: number;
  readonly usage: AiTokenUsageDto;
}

// 제안 받기 event: item (요청한 fields 만 suggested 가 다르고 나머지는 current 와 같다)
export interface AiMetaBatchItemEventDto {
  readonly postUrl: string;
  readonly ok: boolean;
  readonly current?: AiMetaValuesDto;
  readonly suggested?: AiMetaValuesDto;
  readonly message?: string;
}

// 제안 받기 event: done
export interface AiMetaBatchDoneEventDto {
  readonly total: number;
  readonly suggested: number;
  readonly failed: number;
  readonly usage: AiTokenUsageDto;
}

// event: error
export interface AiErrorEventDto {
  readonly code: string;
  readonly message: string;
}

// AI 오류 코드 (서버는 소문자 name 으로 줄 수 있어 비교할 때 대문자로 맞춘다)
export const AI_ERROR = {
  DISABLED: 'AI_DISABLED',
  NO_KEY: 'AI_NO_KEY',
  INVALID_KEY: 'AI_INVALID_KEY',
  LIMIT_EXCEEDED: 'AI_LIMIT_EXCEEDED',
  RATE_LIMITED: 'AI_RATE_LIMITED',
  NOT_ENOUGH_POSTS: 'AI_NOT_ENOUGH_POSTS',
  UPSTREAM: 'AI_UPSTREAM',
} as const;

export const AI_DRAFT_LENGTHS: Array<{ value: AiDraftLength; label: string }> = [
  { value: 'short', label: '짧게' },
  { value: 'medium', label: '보통' },
  { value: 'long', label: '길게' },
];

export const AI_REWRITE_INSTRUCTIONS: Array<{ value: Exclude<AiRewriteInstruction, 'custom'>; label: string }> = [
  { value: 'polish', label: '매끄럽게' },
  { value: 'expand', label: '늘리기' },
  { value: 'shorten', label: '줄이기' },
  { value: 'fix', label: '맞춤법' },
];

// 커버 일괄 만들기 한 번에 보낼 수 있는 글 수 (넘으면 나눠서 차례로 보낸다)
export const AI_COVER_BATCH_MAX = 100;
// 커버 하나 예상 비용 (USD, 화면 안내용)
export const AI_COVER_COST_RANGE: [number, number] = [0.01, 0.02];

// 제목·요약·태그 제안 하나 예상 비용 (USD, 화면 안내용). 한 번에 보낼 수 있는 글 수는 커버와 같다(100).
export const AI_META_COST_RANGE: [number, number] = [0.01, 0.03];

// 월 한도 범위 (USD)
export const AI_MONTHLY_LIMIT_MIN = 0.5;
export const AI_MONTHLY_LIMIT_MAX = 500;
