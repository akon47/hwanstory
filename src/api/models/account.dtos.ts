import DataTransferObject from '@/api/models/common.dtos';

// 사용자 생성 Dto
export interface AccountCreateDto extends DataTransferObject {
  // 계정 사용자 이메일
  readonly email: string;
  // 사용자 로그인 비밀번호
  readonly password: string;
  // 계정 사용자 이름
  readonly name: string;
  // 사용자 이메일 인증 코드
  readonly emailVerifyCode: string;
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
  // 계정에 할당된 역할
  readonly role: Array<RoleDto>;
}

// 간단한 계정 정보 Dto
export interface SimpleAccountDto extends DataTransferObject {
  // 계정 사용자 이메일
  readonly email: string;
  // 계정 사용자 이름
  readonly name: string;
}
