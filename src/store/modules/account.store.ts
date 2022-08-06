import { Module } from 'vuex';
import { RootState } from '../index';
import {
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  saveAccessTokenToLocalStorage,
  saveRefreshTokenToLocalStorage,
} from '@/utils/storage';
import { reissueToken, signIn, signOut } from '@/api/authentication';
import { AuthenticationInfoDto } from '@/api/models/authentication.dtos';
import { AccountCreateDto } from '@/api/models/account.dtos';
import { signUp } from '@/api/accounts';

export interface AccountState {
  accessToken: string;
  refreshToken: string;
}

export const accountStore: Module<AccountState, RootState> = {
  namespaced: true,
  state: () => ({
    accessToken: getAccessTokenFromLocalStorage() || '',
    refreshToken: getRefreshTokenFromLocalStorage() || '',
  }),
  mutations: {
    setAccessToken(state, token) {
      state.accessToken = token;
    },
    setRefreshToken(state, token) {
      state.refreshToken = token;
    },
  },
  actions: {
    async signIn({ commit }, authenticationInfoDto: AuthenticationInfoDto) {
      const token = await signIn(authenticationInfoDto);
      commit('setAccessToken', token.accessToken);
      commit('setRefreshToken', token.refreshToken);
      saveAccessTokenToLocalStorage(token.accessToken);
      saveRefreshTokenToLocalStorage(token.refreshToken);
    },
    async signUp({ commit }, accountCreateDto: AccountCreateDto) {
      await signUp(accountCreateDto);
    },
    async signOut({ commit }) {
      await signOut();
      commit('setAccessToken', '');
      commit('setRefreshToken', '');
      saveAccessTokenToLocalStorage('');
      saveRefreshTokenToLocalStorage('');
    },
    async reissueToken({ commit, state }) {
      const token = await reissueToken(state.refreshToken);
      commit('setAccessToken', token.accessToken);
      commit('setRefreshToken', token.refreshToken);
      saveAccessTokenToLocalStorage(token.accessToken);
      saveRefreshTokenToLocalStorage(token.refreshToken);
    },
  },
};
