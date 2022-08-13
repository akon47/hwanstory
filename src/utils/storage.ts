export const accessTokenKey = 'access-token';
export const refreshTokenKey = 'refresh-token';
export const accessTokenExpiresInKey = 'access-token-expires-in';
export const refreshTokenExpiresInKey = 'refresh-token-expires-in';
export const blogIdKey = 'blog-id';

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

function saveAccessTokenExpiresInToLocalStorage(value: string) {
  localStorage.setItem(accessTokenExpiresInKey, value);
}

function getAccessTokenExpiresInFromLocalStorage() {
  return localStorage.getItem(accessTokenExpiresInKey);
}

function saveRefreshTokenExpiresInToLocalStorage(value: string) {
  localStorage.setItem(refreshTokenExpiresInKey, value);
}

function getRefreshTokenExpiresInFromLocalStorage() {
  return localStorage.getItem(refreshTokenExpiresInKey);
}

function saveBlogIdToLocalStorage(value: string) {
  localStorage.setItem(blogIdKey, value);
}

function getBlogIdFromLocalStorage() {
  return localStorage.getItem(blogIdKey);
}


export {
  saveAccessTokenToLocalStorage,
  getAccessTokenFromLocalStorage,
  saveRefreshTokenToLocalStorage,
  getRefreshTokenFromLocalStorage,
  saveAccessTokenExpiresInToLocalStorage,
  getAccessTokenExpiresInFromLocalStorage,
  saveRefreshTokenExpiresInToLocalStorage,
  getRefreshTokenExpiresInFromLocalStorage,
  saveBlogIdToLocalStorage,
  getBlogIdFromLocalStorage,
};
