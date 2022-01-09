import { combineReducers } from "@reduxjs/toolkit";
import { networkReducer } from "../features/network/networkSlice";
import { releaseReducer } from "../features/release/releaseSlice";
import { mintReducer } from "../features/mint/mintSlice";
import { transactionsReducer } from "../features/transactions/transactionsSlice";
import { uiReducer } from "../features/ui/uiSlice";
import { walletReducer } from "../features/wallet/walletSlice";

const rootReducer = combineReducers({
  ui: uiReducer,
  network: networkReducer,
  wallet: walletReducer,
  mint: mintReducer,
  release: releaseReducer,
  transactions: transactionsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
