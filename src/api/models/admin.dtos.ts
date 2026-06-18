import DataTransferObject from '@/api/models/common.dtos';

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
