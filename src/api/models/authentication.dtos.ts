import DataTransferObject from '@/api/models/common.dtos';

// 계정 인증 정보 Dto
export interface AuthenticationInfoDto extends DataTransferObject {
  // 사용자 계정 이메일
  readonly email: string;
  // 사용자 계정 비밀번호
  readonly password: string;
}

// 계정 인증 토큰 Dto
export interface TokenDto extends DataTransferObject {
  // 인증 토큰 값
  readonly accessToken: string;
  // 인증 토큰 만료 시간
  readonly accessTokenExpiresIn: number;
  // 갱신 토큰 값
  readonly refreshToken: string;
  // 갱신 토큰 만료 시간
  readonly refreshTokenExpiresIn: number;
}
