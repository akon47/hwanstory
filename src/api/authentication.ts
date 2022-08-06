import { authenticationV1 } from './index';
import { AuthenticationInfoDto, TokenDto } from '@/api/models/authentication.dtos';

function signIn(authenticationInfoDto: AuthenticationInfoDto) {
  return authenticationV1.postRequest<TokenDto>('/token', null, authenticationInfoDto);
}

function signOut() {
  return authenticationV1.deleteRequest('/token');
}

function reissueToken(refreshToken: string) {
  return authenticationV1.postRequest<TokenDto>('/refresh-token', null, null, {
    'X-Auth-Refresh-Token': refreshToken,
  });
}

export { signIn, signOut, reissueToken };
