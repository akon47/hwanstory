import { accountsV1 } from './index';
import { CreateAccountDto, AccountDto } from '@/api/models/account.dtos';
import DataTransferObject from '@/api/models/common.dtos';

// 사용자 계정 생성
function signUp(accountCreateDto: CreateAccountDto) {
  return accountsV1.postRequest<AccountDto>('', null, accountCreateDto);
}

// 사용자 이메일 인증 코드 발송
function sendVerifyCodeToEmail(email: string) {
  return accountsV1.postRequest<DataTransferObject>('/verify-email', {
    email: email,
  });
}

// 현재 사용자 계정 조회
function getCurrentAccount() {
  return accountsV1.getRequest<AccountDto>('/me');
}

export { signUp, sendVerifyCodeToEmail, getCurrentAccount };
