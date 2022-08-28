import { Module } from 'vuex';
import { RootState } from '@/store';
import {
  getAccessTokenExpiresInFromLocalStorage,
  getAccessTokenFromLocalStorage,
  getBlogIdFromLocalStorage,
  getRefreshTokenExpiresInFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  getThemeFromLocalStorage,
  saveAccessTokenExpiresInToLocalStorage,
  saveAccessTokenToLocalStorage,
  saveBlogIdToLocalStorage,
  saveRefreshTokenExpiresInToLocalStorage,
  saveRefreshTokenToLocalStorage,
  saveThemeToLocalStorage,
} from '@/utils/storage';
import { reissueToken, signIn, signOut } from '@/api/authentication';
import { AuthenticationInfoDto, TokenDto } from '@/api/models/authentication.dtos';
import { CreateAccountDto } from '@/api/models/account.dtos';
import { getCurrentAccount, signUp } from '@/api/accounts';

export interface AccountState {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  blogId: string;
  theme: string;
  profileImageUrl: string | null;
}

export const accountStore: Module<AccountState, RootState> = {
  namespaced: true,
  state: () => ({
    accessToken: getAccessTokenFromLocalStorage() || '',
    accessTokenExpiresIn: Number(getAccessTokenExpiresInFromLocalStorage() || 0),
    refreshToken: getRefreshTokenFromLocalStorage() || '',
    refreshTokenExpiresIn: Number(getRefreshTokenExpiresInFromLocalStorage() || 0),
    blogId: getBlogIdFromLocalStorage() || '',
    theme: getThemeFromLocalStorage() || '',
    profileImageUrl: null,
  }),
  mutations: {
    setToken(state, token: TokenDto) {
      state.accessToken = token.accessToken;
      state.accessTokenExpiresIn = token.accessTokenExpiresIn;
      state.refreshToken = token.refreshToken;
      state.refreshTokenExpiresIn = token.refreshTokenExpiresIn;
      saveAccessTokenToLocalStorage(token.accessToken);
      saveAccessTokenExpiresInToLocalStorage(token.accessTokenExpiresIn.toString());
      saveRefreshTokenToLocalStorage(token.refreshToken);
      saveRefreshTokenExpiresInToLocalStorage(token.refreshTokenExpiresIn.toString());
    },
    clearToken(state) {
      state.accessToken = '';
      state.accessTokenExpiresIn = 0;
      state.refreshToken = '';
      state.refreshTokenExpiresIn = 0;
      saveAccessTokenToLocalStorage('');
      saveAccessTokenExpiresInToLocalStorage('');
      saveRefreshTokenToLocalStorage('');
      saveRefreshTokenExpiresInToLocalStorage('');
    },
    setBlogId(state, blogId: string) {
      state.blogId = blogId;
      saveBlogIdToLocalStorage(blogId);
    },
    clearBlogId(state) {
      state.blogId = '';
      saveBlogIdToLocalStorage('');
    },
    setTheme(state, theme: string) {
      state.theme = theme;
      saveThemeToLocalStorage(theme);
    },
    setProfileImageUrl(state, profileImageUrl: string) {
      state.profileImageUrl = profileImageUrl;
    },
  },
  getters: {
    // 로그인 되어있는지 여부
    isLoggedIn(state) {
      return state.accessToken && state.refreshToken && state.accessTokenExpiresIn > 0 && state.refreshTokenExpiresIn > 0;
    },
    getTheme(state) {
      return state.theme;
    },
    isDarkTheme(state) {
      return state.theme === 'dark-theme';
    },
    getProfileImageUrl(state) {
      return state.profileImageUrl;
    },
  },
  actions: {
    async signIn({ commit }, authenticationInfoDto: AuthenticationInfoDto) {
      const token = await signIn(authenticationInfoDto);
      commit('setToken', token);
      const account = await getCurrentAccount();
      commit('setBlogId', account.blogId);
      commit('setProfileImageUrl', account.profileImageUrl ?? '');
    },
    async signUp({ commit }, createAccountDto: CreateAccountDto) {
      await signUp(createAccountDto);
    },
    async signOut({ commit }, clearTokenOnly: boolean = false) {
      try {
        if (!clearTokenOnly) {
          await signOut();
        }
      } finally {
        commit('clearToken');
        commit('clearBlogId');
      }
    },
    async reissueToken({ commit, state }) {
      const token = await reissueToken(state.refreshToken);
      commit('setToken', token);
    },
    async toggleTheme({ commit, state }) {
      if (state.theme === 'dark-theme') {
        commit('setTheme', 'light-theme');
      } else {
        commit('setTheme', 'dark-theme');
      }
    },
    async updateCurrentAccountInfo({ commit }) {
      const account = await getCurrentAccount();
      commit('setBlogId', account.blogId);
      commit('setProfileImageUrl', account.profileImageUrl ?? '');
    },
  },
};
