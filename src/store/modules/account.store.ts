import { Module, ActionContext } from "vuex";
import { RootState } from "../index";
import {
    getAccessTokenFromLocalStorage,
    saveAccessTokenToLocalStorage,
    getRefreshTokenFromLocalStorage,
    saveRefreshTokenToLocalStorage,
} from "@/utils/storage";
import {signIn} from "@/api/authentication";
import {AuthenticationInfoDto} from "@/models/authentication/authentication.dtos";

export interface AccountState {
    accessToken: string;
    refreshToken: string;
}

export const accountStore: Module<AccountState, RootState> = {
    namespaced: true,
    state: () => ({
        accessToken: getAccessTokenFromLocalStorage() || "",
        refreshToken: getRefreshTokenFromLocalStorage() || ""
    }),
    mutations: {
        setAccessToken(state, token) {
            state.accessToken = token;
        },
        setRefreshToken(state, token) {
            state.refreshToken = token;
        }
    },
    actions: {
        async signIn({commit}, authenticationInfoDto: AuthenticationInfoDto) {
            const {data} = await signIn(authenticationInfoDto);
            console.log(data);
            commit("setAccessToken", "");
            commit("setRefreshToken", "");
            saveAccessTokenToLocalStorage("");
            saveRefreshTokenToLocalStorage("");
        },
        async signOut({commit}) {

            commit("setAccessToken", "");
            commit("setRefreshToken", "");
            saveAccessTokenToLocalStorage("");
            saveRefreshTokenToLocalStorage("");
        }
    },
};