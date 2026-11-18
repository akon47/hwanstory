import { aiV1 } from './index';
import { postEventStream, SseHandlers, SseStream } from '@/api/common/sseClient';
import {
  AiCoverDto,
  AiCoverRequestDto,
  AiDoneEventDto,
  AiDraftRequestDto,
  AiMetaDto,
  AiMetaRequestDto,
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
  streamAiDraft,
  streamAiRewrite,
  streamAiTranslate,
};
