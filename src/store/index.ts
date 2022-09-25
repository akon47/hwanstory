import { createStore } from 'vuex';
import { AccountState, accountStore } from '@/store/modules/account.store';
import { CommonState, commonStore } from '@/store/modules/common.store';
import { CacheState, cacheStore } from '@/store/modules/cache.store';

export interface RootState {
  accountStore: AccountState;
  commonStore: CommonState;
  cacheStore: CacheState;
}

export default createStore({
  modules: { accountStore, commonStore, cacheStore },
});
