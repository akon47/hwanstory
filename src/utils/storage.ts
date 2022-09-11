const accessTokenKey = 'access-token';
const refreshTokenKey = 'refresh-token';
const accessTokenExpiresInKey = 'access-token-expires-in';
const refreshTokenExpiresInKey = 'refresh-token-expires-in';
const blogIdKey = 'blog-id';
const ThemeKey = 'theme';

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

function saveThemeToLocalStorage(value: string) {
  localStorage.setItem(ThemeKey, value);
}

function getThemeFromLocalStorage() {
  return localStorage.getItem(ThemeKey);
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
  saveThemeToLocalStorage,
  getThemeFromLocalStorage,
};
