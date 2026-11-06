import { deviceV1, tokensV1 } from './index';
import {
  AccessTokenDto,
  CreateAccessTokenDto,
  DeviceApproveRequestDto,
  DeviceAuthorizationDto,
  IssuedAccessTokenDto,
} from '@/api/models/token.dtos';

// 내 액세스 토큰 목록 조회 (폐기·만료 포함)
function getAccessTokens() {
  return tokensV1.getRequest<Array<AccessTokenDto>>('');
}

// 액세스 토큰 발급 (토큰 원문은 응답에서 한 번만)
function createAccessToken(createAccessTokenDto: CreateAccessTokenDto) {
  return tokensV1.postRequest<IssuedAccessTokenDto>('', null, createAccessTokenDto);
}

// 액세스 토큰 폐기
function revokeAccessToken(id: string) {
  return tokensV1.deleteRequest(`/${id}`);
}

// 기기 로그인 요청 조회 (승인 화면)
function getDeviceAuthorization(userCode: string) {
  return deviceV1.getRequest<DeviceAuthorizationDto>(`/${encodeURIComponent(userCode)}`);
}

// 기기 로그인 승인
function approveDeviceAuthorization(userCode: string, ttlDays: number | null) {
  return deviceV1.postRequest<DeviceAuthorizationDto>(`/${encodeURIComponent(userCode)}/approve`, null, {
    ttlDays: ttlDays,
  } as DeviceApproveRequestDto);
}

// 기기 로그인 거부
function denyDeviceAuthorization(userCode: string) {
  return deviceV1.postRequest<DeviceAuthorizationDto>(`/${encodeURIComponent(userCode)}/deny`);
}

export {
  getAccessTokens,
  createAccessToken,
  revokeAccessToken,
  getDeviceAuthorization,
  approveDeviceAuthorization,
  denyDeviceAuthorization,
};
