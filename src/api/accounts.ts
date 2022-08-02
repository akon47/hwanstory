import {accountsV1} from "./index";

// 사용자 계정 생성
function signUp(accountCreateDto: any) {
    return accountsV1.post("/", accountCreateDto);
}

// 사용자 이메일 인증 코드 발송
function sendVerifyCodeToEmail(email: string) {
    return accountsV1.post("/verify-email", {
        params: {
            email: email
        }
    });
}

// 현재 사용자 계정 조회
function getCurrentAccount() {
    return accountsV1.get("/");
}

export {
    signUp,
    sendVerifyCodeToEmail,
    getCurrentAccount
};