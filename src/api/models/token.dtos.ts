import DataTransferObject from '@/api/models/common.dtos';
import { AccountDto } from '@/api/models/account.dtos';

// 토큰 권한(scope) 키
export type AccessTokenScope = 'posts' | 'social';

// 토큰 발급 경로
export type AccessTokenOrigin = 'CONSOLE' | 'DEVICE';

// 개인 액세스 토큰 정보 Dto (토큰 원문은 포함하지 않음)
export interface AccessTokenDto extends DataTransferObject {
  // 토큰 레코드 Id (폐기할 때 사용)
  readonly id: string;
  // 토큰 공개 Id (hsp_<tokenId>_… 의 가운데 부분)
  readonly tokenId: string;
  // 이름
  readonly name: string;
  // 권한 목록
  readonly scopes: Array<AccessTokenScope>;
  // 발급 경로
  readonly origin: AccessTokenOrigin;
  // 발급 시각
  readonly createdAt: string;
  // 만료 시각 (null 이면 무기한)
  readonly expiresAt: string | null;
  // 마지막 사용 시각
  readonly lastUsedAt: string | null;
  // 마지막 사용 IP
  readonly lastUsedIp: string | null;
  // 폐기 시각
  readonly revokedAt: string | null;
  // 만료 여부
  readonly expired: boolean;
  // 사용 가능 여부
  readonly usable: boolean;
}

// 토큰 발급 요청 Dto
export interface CreateAccessTokenDto extends DataTransferObject {
  // 토큰 이름
  readonly name: string;
  // 권한 목록
  readonly scopes: Array<AccessTokenScope>;
  // 만료까지 일수 (null 또는 0 이면 무기한)
  readonly ttlDays: number | null;
}

// 방금 발급된 토큰 Dto (토큰 원문은 한 번만 표시)
export interface IssuedAccessTokenDto extends DataTransferObject {
  // 토큰 원문
  readonly token: string;
  // 토큰 정보
  readonly accessToken: AccessTokenDto;
}

// 현재 토큰과 계정 정보 Dto
export interface CurrentAccessTokenDto extends DataTransferObject {
  readonly account: AccountDto;
  readonly token: AccessTokenDto;
  readonly webBaseUrl: string;
  readonly apiBaseUrl: string;
}

// 기기 로그인 요청 Dto (승인 화면용)
export interface DeviceAuthorizationDto extends DataTransferObject {
  // 사용자 코드 (XXXX-XXXX)
  readonly userCode: string;
  // 요청한 클라이언트 이름
  readonly clientName: string;
  // 요청한 권한 목록
  readonly scopes: Array<AccessTokenScope>;
  // 요청한 IP
  readonly requestedIp: string | null;
  // 요청한 User-Agent
  readonly requestedUa: string | null;
  // 상태
  readonly status: 'PENDING' | 'APPROVED' | 'DENIED' | 'ISSUED';
  // 요청 시각
  readonly createdAt: string;
  // 코드 만료 시각
  readonly expiresAt: string;
}

// 기기 로그인 승인 요청 Dto
export interface DeviceApproveRequestDto extends DataTransferObject {
  // 발급할 토큰의 만료까지 일수 (null 이면 기본값, 0 이면 무기한)
  readonly ttlDays: number | null;
}

// 권한 설명 (화면 표시용)
export const ACCESS_TOKEN_SCOPE_DESCRIPTIONS: Record<AccessTokenScope, string> = {
  posts: '게시글·시리즈 작성/수정/삭제, 파일 업로드',
  social: '댓글·좋아요·북마크·이모지 반응·팔로우, 알림 읽음/삭제',
};
