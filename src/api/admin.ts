import { adminV1 } from './index';
import { PageDto, SliceDto } from '@/api/models/common.dtos';
import {
  AdminAccountDto,
  AdminActiveViewersDto,
  AdminCommentDto,
  AdminDashboardDto,
  AdminStatisticsDto,
  AdminSystemDto,
  AdminTokenDto,
} from '@/api/models/admin.dtos';
import { OpenType, SimplePostDto } from '@/api/models/blog.dtos';

// 대시보드 조회 (요약·최근 30일 추이·최근 활동)
function getDashboard() {
  return adminV1.getRequest<AdminDashboardDto>('/dashboard');
}

// 대시보드 통계 조회
function getStatistics() {
  return adminV1.getRequest<AdminStatisticsDto>('/statistics');
}

// 시스템 상태 조회
function getSystem() {
  return adminV1.getRequest<AdminSystemDto>('/system');
}

// 회원 목록 조회
function getAccounts(size: number, search: string | null = null, cursorId: string | null = null) {
  return adminV1.getRequest<SliceDto<AdminAccountDto>>('/accounts', {
    cursorId: cursorId,
    size: size,
    ...search && { search: search },
  });
}

// 회원 정지
function disableAccount(accountId: string) {
  return adminV1.putRequest(`/accounts/${accountId}/disable`);
}

// 회원 정지 해제
function restoreAccount(accountId: string) {
  return adminV1.putRequest(`/accounts/${accountId}/restore`);
}

// 관리자 권한 부여/회수
function setAdminRole(accountId: string, admin: boolean) {
  return adminV1.putRequest<AdminAccountDto>(`/accounts/${accountId}/roles`, null, { admin });
}

// 글 목록 조회 (비공개·임시저장 포함)
function getPosts(page: number, size: number, search: string | null = null, openType: OpenType | null = null) {
  return adminV1.getRequest<PageDto<SimplePostDto>>('/posts', {
    page: page,
    size: size,
    ...search && { search: search },
    ...openType && { openType: openType },
  });
}

// 글 공개 유형 변경
function changePostOpenType(postId: string, openType: OpenType) {
  return adminV1.putRequest<SimplePostDto>(`/posts/${postId}/open-type`, null, { openType });
}

// 글 삭제
function deletePost(postId: string) {
  return adminV1.deleteRequest(`/posts/${postId}`);
}

// 댓글 목록 조회
function getComments(page: number, size: number, search: string | null = null) {
  return adminV1.getRequest<PageDto<AdminCommentDto>>('/comments', {
    page: page,
    size: size,
    ...search && { search: search },
  });
}

// 댓글 삭제
function deleteComment(commentId: string) {
  return adminV1.deleteRequest(`/comments/${commentId}`);
}

// 액세스 토큰 전체 조회
function getTokens() {
  return adminV1.getRequest<Array<AdminTokenDto>>('/tokens');
}

// 액세스 토큰 폐기
function revokeToken(tokenId: string) {
  return adminV1.deleteRequest(`/tokens/${tokenId}`);
}

// 실시간 접속자 조회
function getActiveViewers() {
  return adminV1.getRequest<AdminActiveViewersDto>('/active-viewers');
}

export {
  getDashboard,
  getStatistics,
  getSystem,
  getAccounts,
  disableAccount,
  restoreAccount,
  setAdminRole,
  getPosts,
  changePostOpenType,
  deletePost,
  getComments,
  deleteComment,
  getTokens,
  revokeToken,
  getActiveViewers,
};
