import { createHttpApiClient, HttpApiClient } from '@/api/common/httpApiClient';

export const accountsV1: HttpApiClient = createHttpApiClient('v1/accounts');
export const authenticationV1: HttpApiClient = createHttpApiClient('v1/authentication');
export const blogV1: HttpApiClient = createHttpApiClient('v1/blog');
export const attachmentsV1: HttpApiClient = createHttpApiClient('v1/attachments');

export const notificationsV1: HttpApiClient = createHttpApiClient('v1/notifications');

export const followV1: HttpApiClient = createHttpApiClient('v1/follow');
export const feedV1: HttpApiClient = createHttpApiClient('v1/feed');

export const adminV1: HttpApiClient = createHttpApiClient('v1/admin');

// 사이트 공통 (공지 배너 조회 · 글/댓글 신고)
export const siteV1: HttpApiClient = createHttpApiClient('v1/site');

// 개인 액세스 토큰 (AI 에이전트용) 관리 · 기기 로그인 승인
export const tokensV1: HttpApiClient = createHttpApiClient('v1/tokens');
export const deviceV1: HttpApiClient = createHttpApiClient('v1/authentication/device');
