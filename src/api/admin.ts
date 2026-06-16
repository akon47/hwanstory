import { adminV1 } from './index';
import { SliceDto } from '@/api/models/common.dtos';
import { AdminAccountDto, AdminStatisticsDto } from '@/api/models/admin.dtos';

// 회원 목록 조회
function getAccounts(size: number, search: string | null = null, cursorId: string | null = null) {
  return adminV1.getRequest<SliceDto<AdminAccountDto>>(`/accounts`, {
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

// 대시보드 통계 조회
function getStatistics() {
  return adminV1.getRequest<AdminStatisticsDto>(`/statistics`);
}

export { getAccounts, disableAccount, restoreAccount, getStatistics };
