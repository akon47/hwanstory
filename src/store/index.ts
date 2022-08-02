import {createStore} from "vuex";
import {
    getAccessTokenFromLocalStorage,
    saveAccessTokenToLocalStorage,
    getRefreshTokenFromLocalStorage,
    saveRefreshTokenToLocalStorage,
} from "../utils/storage";

export default createStore({
    state: {
        accessToken: getAccessTokenFromLocalStorage() || "",
        refreshToken: getRefreshTokenFromLocalStorage() || ""
    },
    mutations: {
        setAccessToken(state, token) {
            state.accessToken = token;
        },
        setRefreshToken(state, token) {
            state.refreshToken = token;
        }
    },
    actions: {
        async signOut({commit}) {

            commit("setAccessToken", "");
            commit("setRefreshToken", "");
            saveAccessTokenToLocalStorage("");
            saveRefreshTokenToLocalStorage("");
        }
    },
    modules: {},
});