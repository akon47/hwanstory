import { Module } from 'vuex';
import { RootState } from '@/store';
import {
  getThemeFromLocalStorage, saveThemeToLocalStorage,
} from '@/utils/storage';
import blogWebSocketClient from "@/utils/websocket";

export interface CommonState {
  theme: string;
  sessionCount: number | null;
}

export const commonStore: Module<CommonState, RootState> = {
  namespaced: true,
  state: () => ({
    theme: getThemeFromLocalStorage() || '',
    sessionCount: blogWebSocketClient.sessionCount,
  }),
  mutations: {
    setTheme(state, theme: string) {
      state.theme = theme;
      saveThemeToLocalStorage(theme);
    },
    setSessionCount(state, sessionCount: number | null) {
      state.sessionCount = sessionCount;
    },
  },
  getters: {
    getTheme(state) {
      return state.theme;
    },
    isDarkTheme(state) {
      return state.theme === 'dark-theme';
    },
    sessionCount(state) {
      return state.sessionCount;
    },
  },
  actions: {
    async toggleTheme({ commit, state }) {
      if (state.theme === 'dark-theme') {
        commit('setTheme', 'light-theme');
      } else {
        commit('setTheme', 'dark-theme');
      }
    },
    async updateSessionCount({commit}) {
      commit('setSessionCount', blogWebSocketClient.sessionCount)
    },
  },
};