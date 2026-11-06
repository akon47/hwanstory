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
} from '@/utils/storage';
import { reissueToken, signIn, signOut } from '@/api/authentication';
import { AuthenticationInfoDto, TokenDto } from '@/api/models/authentication.dtos';
import { getCurrentAccount } from '@/api/accounts';
import { AccountDto } from '@/api/models/account.dtos';

export interface AccountState {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  blogId: string;
  name: string;
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
    name: '',
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
    // 헤더 메뉴 등에 쓰는 현재 계정 요약 (이름·프로필 사진)
    setAccountSummary(state, account: AccountDto | null) {
      state.name = account?.name ?? '';
      state.profileImageUrl = account?.profileImageUrl ?? '';
    },
  },
  getters: {
    // 로그인 되어있는지 여부
    isLoggedIn(state) {
      return state.accessToken && state.refreshToken && state.accessTokenExpiresIn > 0 && state.refreshTokenExpiresIn > 0;
    },
    // 관리자 권한 보유 여부 (액세스 토큰 JWT의 auth 클레임을 디코드하여 판단)
    isAdmin(state) {
      const token = state.accessToken;
      if (!token) {
        return false;
      }
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
        const authorities: string = payload.auth ?? '';
        return authorities.split(',').includes('ROLE_ADMIN');
      } catch (e) {
        return false;
      }
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
      commit('setAccountSummary', account);
    },
    async signOut({ commit }, clearTokenOnly: boolean = false) {
      try {
        if (!clearTokenOnly) {
          await signOut();
        }
      } finally {
        commit('clearToken');
        commit('clearBlogId');
        commit('setAccountSummary', null);
      }
    },
    async reissueToken({ commit, state }) {
      const token = await reissueToken(state.refreshToken);
      commit('setToken', token);
    },
    async updateCurrentAccountInfo({ commit }) {
      const account = await getCurrentAccount();
      commit('setBlogId', account.blogId);
      commit('setAccountSummary', account);
    },
    async setToken({ commit }, token: TokenDto) {
      commit('setToken', token);
      const account = await getCurrentAccount();
      commit('setBlogId', account.blogId);
      commit('setAccountSummary', account);
    },
  },
};
