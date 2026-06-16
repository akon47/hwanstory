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
