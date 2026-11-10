import DataTransferObject from '@/api/models/common.dtos';

// 공지 배너 종류
export type AnnouncementLevel = 'info' | 'success' | 'warning';

// 사이트 공지 Dto (화면 맨 위 배너)
export interface AnnouncementDto extends DataTransferObject {
  // 공지를 보여줄지
  readonly enabled: boolean;
  readonly message: string | null;
  readonly level: AnnouncementLevel | null;
  // 자세히 보기 링크 (사이트 안 경로 또는 https 주소)
  readonly linkUrl: string | null;
  readonly updatedAt: string | null;
}

// 신고 대상·사유·처리 상태
export type ReportTargetType = 'POST' | 'COMMENT';
export type ReportReason = 'SPAM' | 'ABUSE' | 'ILLEGAL' | 'PRIVACY' | 'COPYRIGHT' | 'OTHER';
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

// 신고 사유 표시 이름 (신고 창과 관리자 화면이 함께 쓴다)
export const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'SPAM', label: '스팸·광고' },
  { value: 'ABUSE', label: '욕설·비방·혐오' },
  { value: 'ILLEGAL', label: '불법·유해한 내용' },
  { value: 'PRIVACY', label: '개인정보 노출' },
  { value: 'COPYRIGHT', label: '저작권 침해' },
  { value: 'OTHER', label: '기타' },
];

export function reportReasonLabel(reason: ReportReason): string {
  return REPORT_REASONS.find((item) => item.value === reason)?.label ?? reason;
}
