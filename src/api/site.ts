import { siteV1 } from './index';
import { AnnouncementDto, ReportReason, ReportTargetType } from '@/api/models/site.dtos';

// 화면 맨 위에 보여줄 공지 조회 (없으면 enabled=false)
function getAnnouncement() {
  return siteV1.getRequest<AnnouncementDto>('/announcement');
}

// 글·댓글 신고 (로그인하지 않아도 된다)
function createReport(targetType: ReportTargetType, targetId: string, reason: ReportReason, detail: string | null) {
  return siteV1.postRequest('/reports', null, { targetType, targetId, reason, detail });
}

export {
  getAnnouncement,
  createReport,
};
