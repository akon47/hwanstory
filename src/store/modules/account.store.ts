import { Module } from 'vuex';
import { RootState } from '@/store';
import {
  getAccessTokenExpiresInFromLocalStorage,
  getAccessTokenFromLocalStorage,
  getBlogIdFromLocalStorage,
  getRefreshTokenExpiresInFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  saveAccessTokenExpiresInToLocalStorage,
  saveAccessTokenToLocalStorage,
  saveBlogIdToLocalStorage,
  saveRefreshTokenExpiresInToLocalStorage,
  saveRefreshTokenToLocalStorage,
  saveThemeToLocalStorage,
} from '@/utils/storage';
import { reissueToken, signIn, signOut } from '@/api/authentication';
import { AuthenticationInfoDto, TokenDto } from '@/api/models/authentication.dtos';
import { getCurrentAccount } from '@/api/accounts';

export interface AccountState {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  blogId: string;
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
    setProfileImageUrl(state, profileImageUrl: string) {
      state.profileImageUrl = profileImageUrl;
    },
  },
  getters: {
    // 로그인 되어있는지 여부
    isLoggedIn(state) {
      return state.accessToken && state.refreshToken && state.accessTokenExpiresIn > 0 && state.refreshTokenExpiresIn > 0;
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
    async updateCurrentAccountInfo({ commit }) {
      const account = await getCurrentAccount();
      commit('setBlogId', account.blogId);
      commit('setProfileImageUrl', account.profileImageUrl ?? '');
    },
    async setToken({ commit }, token: TokenDto) {
      commit('setToken', token);
      const account = await getCurrentAccount();
      commit('setBlogId', account.blogId);
      commit('setProfileImageUrl', account.profileImageUrl ?? '');
    },
  },
};
