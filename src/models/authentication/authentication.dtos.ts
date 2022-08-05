export interface AuthenticationInfoDto {
    // 사용자 계정 이메일
    email: string;
    // 사용자 계정 비밀번호
    password: string;
}

export interface TokenDto {
    // 인증 토큰 값
    accessToken: string;
    // 인증 토큰 만료 시간
    accessTokenExpiresIn: bigint,
    // 갱신 토큰 값
    refreshToken: string;
    // 갱신 토큰 만료 시간
    refreshTokenExpiresIn: bigint,
}