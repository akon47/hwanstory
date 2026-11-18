import { aiV1 } from './index';
import { postEventStream, SseHandlers, SseStream } from '@/api/common/sseClient';
import {
  AiCoverBatchDoneEventDto,
  AiCoverBatchItemEventDto,
  AiCoverBatchRequestDto,
  AiCoverDto,
  AiCoverRequestDto,
  AiDoneEventDto,
  AiDraftRequestDto,
  AiMetaApplyRequestDto,
  AiMetaApplyResultDto,
  AiMetaBatchDoneEventDto,
  AiMetaBatchItemEventDto,
  AiMetaBatchRequestDto,
  AiMetaCandidatesDto,
  AiMetaDto,
  AiMetaRequestDto,
  AiMissingCoversDto,
  AiRewriteRequestDto,
  AiSettingsDto,
  AiSettingsRequestDto,
  AiStyleDto,
  AiTranslateDoneEventDto,
  AiTranslateRequestDto,
} from '@/api/models/ai.dtos';

// AI 설정 조회 (키는 끝 4자리만)
function getAiSettings() {
  return aiV1.getRequest<AiSettingsDto>('/settings');
}

// AI 설정 저장 (apiKey 를 넣으면 서버가 Anthropic 에 확인한 뒤 암호화해 저장)
function saveAiSettings(request: AiSettingsRequestDto) {
  return aiV1.putRequest<AiSettingsDto>('/settings', null, request);
}

// API 키만 지운다 (문체·사용 기록은 남는다)
function deleteAiKey() {
  return aiV1.deleteRequest('/settings/key');
}

// 내 글로 문체 다시 분석
function analyzeAiStyle() {
  return aiV1.postRequest<AiStyleDto>('/style/analyze');
}

// 제목·요약·태그·글 주소 만들기
function generateAiMeta(request: AiMetaRequestDto) {
  return aiV1.postRequest<AiMetaDto>('/meta', null, request);
}

// 커버 이미지(1200×630 PNG) 만들기 → 첨부 Id·경로
function generateAiCover(request: AiCoverRequestDto) {
  return aiV1.postRequest<AiCoverDto>('/cover', null, request);
}

// 커버(썸네일) 없는 내 글 목록
function getAiMissingCovers() {
  return aiV1.getRequest<AiMissingCoversDto>('/covers/missing');
}

// 커버 일괄 만들기 (SSE: status / item(글마다) / done{created, skipped, failed, usage} / error). 끊으면 하던 글까지만 끝낸다.
function streamAiCoverBatch(
    request: AiCoverBatchRequestDto,
    handlers: SseHandlers<AiCoverBatchDoneEventDto, AiCoverBatchItemEventDto>,
): SseStream {
  return postEventStream('v1/ai/covers/batch', request, handlers);
}

// 제목·요약·태그 한꺼번에 채우기 후보 (태그가 없거나 요약이 짧은 내 글)
function getAiMetaCandidates() {
  return aiV1.getRequest<AiMetaCandidatesDto>('/meta/candidates');
}

// 제목·요약·태그 제안 받기 (SSE: status / item(글마다 current·suggested) / done / error). 글은 바꾸지 않는다.
function streamAiMetaBatch(
    request: AiMetaBatchRequestDto,
    handlers: SseHandlers<AiMetaBatchDoneEventDto, AiMetaBatchItemEventDto>,
): SseStream {
  return postEventStream('v1/ai/meta/batch', request, handlers);
}

// 고른 제안만 적용 (AI 호출 없음)
function applyAiMetaBatch(request: AiMetaApplyRequestDto) {
  return aiV1.postRequest<AiMetaApplyResultDto>('/meta/apply', null, request);
}

// 초안 쓰기 (SSE: status / delta / done{sources} / error)
function streamAiDraft(request: AiDraftRequestDto, handlers: SseHandlers<AiDoneEventDto>): SseStream {
  return postEventStream('v1/ai/draft', request, handlers);
}

// 선택한 부분 다듬기 (SSE: 바꿀 텍스트만 delta 로)
function streamAiRewrite(request: AiRewriteRequestDto, handlers: SseHandlers<AiDoneEventDto>): SseStream {
  return postEventStream('v1/ai/rewrite', request, handlers);
}

// 영어판 (SSE: 영어 본문 delta, done 에 영어 title·summary)
function streamAiTranslate(request: AiTranslateRequestDto, handlers: SseHandlers<AiTranslateDoneEventDto>): SseStream {
  return postEventStream('v1/ai/translate', request, handlers);
}

export {
  getAiSettings,
  saveAiSettings,
  deleteAiKey,
  analyzeAiStyle,
  generateAiMeta,
  generateAiCover,
  getAiMissingCovers,
  streamAiCoverBatch,
  getAiMetaCandidates,
  streamAiMetaBatch,
  applyAiMetaBatch,
  streamAiDraft,
  streamAiRewrite,
  streamAiTranslate,
};
