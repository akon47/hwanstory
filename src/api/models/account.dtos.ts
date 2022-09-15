import DataTransferObject from '@/api/models/common.dtos';

// 사용자 생성 Dto
export interface CreateAccountDto extends DataTransferObject {
  // 계정 사용자 이메일
  readonly email: string;
  // 사용자 로그인 비밀번호
  readonly password: string | null;
  // 계정 사용자 이름
  readonly name: string;
  // 블로그 Id
  readonly blogId: string;
  // 사용자 이메일 인증 코드
  readonly emailVerifyCode: string | null;
}

// 사용자 정보 수정 Dto
export interface ModifyAccountDto extends DataTransferObject {
  // 계정 사용자 이름
  readonly name: string;
  // 간단한 자기소개
  readonly biography: string | null;
  // 회사
  readonly company: string | null;
  // 위치
  readonly location: string | null;
  // 홈페이지
  readonly homepage: string | null;
}

// 사용자 비밀번호 재설정 Dto
export interface ResetPasswordDto extends DataTransferObject {
  // 새 로그인 비밀번호
  readonly newPassword: string;
  // 비밀번호 재설정 토큰
  readonly resetPasswordToken: string;
}

// 역할 Dto
export interface RoleDto extends DataTransferObject {
  // 역할 이름
  readonly name: string;
}

// 계정 정보 Dto
export interface AccountDto extends DataTransferObject {
  // 계정 사용자 이메일
  readonly email: string;
  // 계정 사용자 이름
  readonly name: string;
  // 블로그 Id
  readonly blogId: string;
  // 프로필 이미지 URL
  readonly profileImageUrl: string;
  // 간단한 자기소개
  readonly biography: string;
  // 회사
  readonly company: string;
  // 위치
  readonly location: string;
  // 홈페이지
  readonly homepage: string;
  // 계정에 할당된 역할
  readonly role: Array<RoleDto>;
}

// 간단한 계정 정보 Dto
export interface SimpleAccountDto extends DataTransferObject {
  // 계정 사용자 이름
  readonly name: string;
  // 블로그 Id
  readonly blogId: string;
  // 프로필 이미지 URL
  readonly profileImageUrl: string;
}
