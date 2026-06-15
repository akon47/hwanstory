import { Module } from 'vuex';
import { RootState } from '@/store';
import {
  getThemeFromLocalStorage, saveThemeToLocalStorage,
} from '@/utils/storage';
import blogWebSocketClient from "@/utils/websocket";

export interface CommonState {
  theme: string;
  sessionCount: number | null;
  postViewerCounts: Record<string, number>;
}

export const commonStore: Module<CommonState, RootState> = {
  namespaced: true,
  state: () => ({
    theme: getThemeFromLocalStorage() || '',
    sessionCount: blogWebSocketClient.sessionCount,
    postViewerCounts: { ...blogWebSocketClient.postViewerCounts },
  }),
  mutations: {
    setTheme(state, theme: string) {
      state.theme = theme;
      saveThemeToLocalStorage(theme);
    },
    setSessionCount(state, sessionCount: number | null) {
      state.sessionCount = sessionCount;
    },
    setPostViewerCounts(state, postViewerCounts: Record<string, number>) {
      state.postViewerCounts = postViewerCounts;
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
    postViewerCount: (state) => (postId: string | undefined | null) => {
      return (postId && state.postViewerCounts[postId]) || 0;
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
    async updatePostViewerCounts({commit}) {
      commit('setPostViewerCounts', { ...blogWebSocketClient.postViewerCounts })
    },
  },
};