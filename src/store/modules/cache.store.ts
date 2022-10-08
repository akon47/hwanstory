import { Module } from 'vuex';
import { RootState } from '@/store';
import { SimplePostDto } from '@/api/models/blog.dtos';

export interface PostLoadedState {
  simplePosts: Array<SimplePostDto>,
  cursorId: '',
  isNoMorePage: false,
}

export interface CacheState {
  cachedMainPosts: PostLoadedState | null;
}

export const cacheStore: Module<CacheState, RootState> = {
  namespaced: true,
  state: () => ({
    cachedMainPosts: null,
  }),
  mutations: {
    setMainPosts(state, postLoadedState: PostLoadedState) {
      state.cachedMainPosts = postLoadedState;
    },
    clearMainPosts(state) {
      state.cachedMainPosts = null;
    },
  },
  getters: {
    getCachedMainPosts(state) {
      return state.cachedMainPosts;
    },
  },
  actions: {
    async setMainPosts({ commit }, postLoadedState: PostLoadedState) {
      commit('setMainPosts', postLoadedState);
    },
    async clearMainPosts({ commit }) {
      commit('clearMainPosts');
    },
  },
};