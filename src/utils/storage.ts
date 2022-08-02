export const accessTokenKey = "access-token";
export const refreshTokenKey = "refresh-token";

function saveAccessTokenToLocalStorage(value) {
    localStorage.setItem(accessTokenKey, value);
}

function getAccessTokenFromLocalStorage() {
    return localStorage.getItem(accessTokenKey);
}

function saveRefreshTokenToLocalStorage(value) {
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