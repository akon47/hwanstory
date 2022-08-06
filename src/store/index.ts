import { createStore } from 'vuex';
import { AccountState, accountStore } from '@/store/modules/account.store';

export interface RootState {
  accountStore: AccountState;
}

export default createStore({
  modules: { accountStore },
});
