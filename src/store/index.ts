import {createStore} from "vuex";
import {accountStore, AccountState} from "@/store/modules/account.store"

export interface RootState {
    accountStore: AccountState;
}

export default createStore({
   modules: {accountStore}
});