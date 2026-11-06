import DataTransferObject from '@/api/models/common.dtos';
import { SimpleAccountDto } from '@/api/models/account.dtos';
import { SimplePostDto } from '@/api/models/blog.dtos';

// 관리자용 계정 정보 Dto
export interface AdminAccountDto extends DataTransferObject {
  // 계정 Id
  readonly id: string;
  // 이메일
  readonly email: string;
  // 이름
  readonly name: string;
  // 블로그 Id
  readonly blogId: string;
  // 프로필 이미지 URL
  readonly profileImageUrl: string | null;
  // 정지(비활성화) 여부
  readonly deleted: boolean;
  // 보유 역할 목록
  readonly roles: Array<string>;
  // 가입 시각
  readonly createdAt: Date;
}

// 관리자 대시보드 통계 Dto
export interface AdminStatisticsDto extends DataTransferObject {
  // 활성 회원 수
  readonly memberCount: number;
  // 전체 게시글 수
  readonly postCount: number;
  // 전체 댓글 수
  readonly commentCount: number;
}

// 관리자 실시간 접속자(시청자 1명) Dto
export interface AdminActiveViewerDto extends DataTransferObject {
  // 클라이언트 IP
  readonly ip: string;
  // 클라이언트 User-Agent
  readonly userAgent: string;
  // 웹소켓 접속 시각
  readonly connectedAt: Date | null;
  // 로그인 사용자 이름 (비회원이면 null)
  readonly memberName: string | null;
  // 로그인 사용자 이메일 (비회원이면 null)
  readonly memberEmail: string | null;
  // 보고 있는 게시글 Id
  readonly postId: string | null;
  // 보고 있는 게시글 제목 (비공개 등으로 조회 불가 시 null)
  readonly postTitle: string | null;
  // 게시글 URL (링크 생성용)
  readonly postUrl: string | null;
  // 게시글 작성자 블로그 Id (링크 생성용)
  readonly blogId: string | null;
}

// 관리자 실시간 접속자 목록 Dto
export interface AdminActiveViewersDto extends DataTransferObject {
  // 현재 연결된 전체 웹소켓 세션 수
  readonly totalSessions: number;
  // 현재 게시글을 보고 있는 시청자 목록
  readonly viewers: Array<AdminActiveViewerDto>;
}

// 관리자 대시보드 일별 집계
export interface AdminDailyCountDto extends DataTransferObject {
  readonly date: string;
  readonly members: number;
  readonly posts: number;
  readonly comments: number;
}

// 관리자용 댓글 Dto
export interface AdminCommentDto extends DataTransferObject {
  readonly id: string;
  readonly content: string;
  readonly author: SimpleAccountDto;
  readonly parentId: string | null;
  readonly likeCount: number;
  readonly postBlogId: string | null;
  readonly postUrl: string | null;
  readonly postTitle: string | null;
  readonly createdAt: Date;
}

// 관리자 대시보드 Dto
export interface AdminDashboardDto extends DataTransferObject {
  readonly memberCount: number;
  readonly postCount: number;
  readonly publicPostCount: number;
  readonly commentCount: number;
  readonly totalHits: number;
  readonly sessionCount: number;
  readonly viewingCount: number;
  readonly todayMembers: number;
  readonly todayPosts: number;
  readonly todayComments: number;
  readonly daily: Array<AdminDailyCountDto>;
  readonly recentPosts: Array<SimplePostDto>;
  readonly recentComments: Array<AdminCommentDto>;
  readonly recentMembers: Array<AdminAccountDto>;
}

// 관리자용 액세스 토큰 Dto
export interface AdminTokenDto extends DataTransferObject {
  readonly id: string;
  readonly tokenId: string;
  readonly name: string;
  readonly scopes: Array<string>;
  readonly origin: 'WEB' | 'DEVICE';
  readonly owner: SimpleAccountDto | null;
  readonly ownerEmail: string | null;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly lastUsedAt: string | null;
  readonly lastUsedIp: string | null;
  readonly revokedAt: string | null;
  readonly expired: boolean;
  readonly usable: boolean;
}

// 관리자용 시스템 상태 Dto
export interface AdminSystemDto extends DataTransferObject {
  readonly appVersion: string | null;
  readonly buildTime: string | null;
  readonly profile: string;
  readonly javaVersion: string;
  readonly startedAt: string;
  readonly uptimeMillis: number;
  readonly processors: number;
  readonly heapUsedBytes: number;
  readonly heapMaxBytes: number;
  readonly databaseOk: boolean;
  readonly redisOk: boolean;
  readonly websocketSessions: number;
  readonly attachmentCount: number;
  readonly attachmentBytes: number;
  readonly attachmentPath: string;
  readonly attachmentFreeBytes: number;
  readonly attachmentTotalBytes: number;
  readonly scheduledPostCount: number;
  readonly pendingDeviceCount: number;
  readonly activeTokenCount: number;
}
