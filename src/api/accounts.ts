import { accountsV1 } from './index';
import { CreateAccountDto, AccountDto, ModifyAccountDto, ResetPasswordDto } from '@/api/models/account.dtos';
import DataTransferObject from '@/api/models/common.dtos';
import { marked } from 'marked';
import defaults = marked.defaults;

// 사용자 계정 생성
function signUp(accountCreateDto: CreateAccountDto, registerToken: String | null = null) {
  return accountsV1.postRequest<AccountDto>('', registerToken ? {
    registerToken: registerToken,
  } : null, accountCreateDto);
}

// 사용자 정보 수정
function modifyAccountInfo(modifyAccountDto: ModifyAccountDto) {
  return accountsV1.putRequest<AccountDto>('', null, modifyAccountDto);
}

// 사용자 이메일 인증 코드 발송
function sendVerifyCodeToEmail(email: string) {
  return accountsV1.postRequest<DataTransferObject>('/verify-email', {
    email: email,
  });
}

// 사용자 계정 비밀번호 재설정 Url 이메일 발송
function sendResetPasswordUrlToEmail(email: string) {
  return accountsV1.postRequest<DataTransferObject>('/reset-password-email', {
    email: email,
  });
}

// 사용자 계정 비밀번호 재설정
function resetPassword(resetPasswordDto: ResetPasswordDto) {
  return accountsV1.putRequest('/password', null, resetPasswordDto);
}

// 현재 사용자 계정 조회
function getCurrentAccount() {
  return accountsV1.getRequest<AccountDto>('/me');
}

// 현재 사용자 프로필 사진 변경 (업로드)
function setCurrentProfileImage(blob: Blob) {
  return accountsV1.uploadFileRequest<AccountDto>('/me/profile-image', 'profileImageFile', Array.of(blob));
}

// 현재 사용자 계정 삭제
function deleteCurrentAccount() {
  return accountsV1.deleteRequest('/me');
}

export {
  signUp,
  modifyAccountInfo,
  sendVerifyCodeToEmail,
  getCurrentAccount,
  setCurrentProfileImage,
  deleteCurrentAccount,
  sendResetPasswordUrlToEmail,
  resetPassword,
};
