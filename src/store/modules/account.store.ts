import { Module } from 'vuex';
import { RootState } from '@/store';
import {
  getAccessTokenExpiresInFromLocalStorage,
  getAccessTokenFromLocalStorage, getRefreshTokenExpiresInFromLocalStorage,
  getRefreshTokenFromLocalStorage, saveAccessTokenExpiresInToLocalStorage,
  saveAccessTokenToLocalStorage, saveRefreshTokenExpiresInToLocalStorage,
  saveRefreshTokenToLocalStorage,
} from '@/utils/storage';
import { reissueToken, signIn, signOut } from '@/api/authentication';
import { AuthenticationInfoDto, TokenDto } from '@/api/models/authentication.dtos';
import { CreateAccountDto } from '@/api/models/account.dtos';
import { signUp } from '@/api/accounts';

export interface AccountState {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}

export const accountStore: Module<AccountState, RootState> = {
  namespaced: true,
  state: () => ({
    accessToken: getAccessTokenFromLocalStorage() || '',
    accessTokenExpiresIn: Number(getAccessTokenExpiresInFromLocalStorage() || 0),
    refreshToken: getRefreshTokenFromLocalStorage() || '',
    refreshTokenExpiresIn: Number(getRefreshTokenExpiresInFromLocalStorage() || 0),
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
  },
  getters: {
    // 로그인 되어있는지 여부
    isLoggedIn(state) {
      return state.accessToken && state.refreshToken && state.accessTokenExpiresIn > 0 && state.refreshTokenExpiresIn > 0;
    },
  },
  actions: {
    async signIn({ commit }, authenticationInfoDto: AuthenticationInfoDto) {
      const token = await signIn(authenticationInfoDto);
      commit('setToken', token);
    },
    async signUp({ commit }, createAccountDto: CreateAccountDto) {
      await signUp(createAccountDto);
    },
    async signOut({ commit }, clearTokenOnly: boolean = false) {
      if (!clearTokenOnly) {
        await signOut();
      }
      commit('clearToken');
    },
    async reissueToken({ commit, state }) {
      const token = await reissueToken(state.refreshToken);
      commit('setToken', token);
    },
  },
};
