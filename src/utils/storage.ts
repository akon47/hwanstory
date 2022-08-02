export const accessTokenKey = "access-token";
export const refreshTokenKey = "refresh-token";

function saveAccessTokenToLocalStorage(value: string) {
    localStorage.setItem(accessTokenKey, value);
}

function getAccessTokenFromLocalStorage() {
    return localStorage.getItem(accessTokenKey);
}

function saveRefreshTokenToLocalStorage(value: string) {
    localStorage.setItem(refreshTokenKey, value);
}

function getRefreshTokenFromLocalStorage() {
    return localStorage.getItem(refreshTokenKey);
}

export {
    saveAccessTokenToLocalStorage,
    getAccessTokenFromLocalStorage,
    saveRefreshTokenToLocalStorage,
    getRefreshTokenFromLocalStorage,
};