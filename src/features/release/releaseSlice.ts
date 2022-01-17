import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../store/rootReducer";
import { BridgeCurrency } from "../../utils/assetConfigs";


type ReleaseState = {
  currency: BridgeCurrency;
  address: string;
  amount: number;
};

let initialState: ReleaseState = {
  currency: BridgeCurrency.RENDFI,
  address: "", // mzseycKNBVKFW1PjzisnPER226bJsGfnUh
  amount: 0,
};

const slice = createSlice({
  name: "release",
  initialState,
  reducers: {
    setReleaseCurrency(state, action: PayloadAction<BridgeCurrency>) {
      state.currency = action.payload;
    },
    setReleaseAddress(state, action: PayloadAction<string>) {
      state.address = action.payload;
    },
    setReleaseAmount(state, action: PayloadAction<string>) {
      state.amount = parseFloat(action.payload) || 0;
    },
    resetRelease(state, action: PayloadAction<ReleaseState | undefined>) {
      if (action.payload) {
        state.currency = action.payload.currency;
        state.address = action.payload.address;
      } else {
        state.address = initialState.address;
      }
    },
  },
});

export const {
  setReleaseCurrency,
  setReleaseAddress,
  setReleaseAmount,
  resetRelease,
} = slice.actions;

export const releaseReducer = slice.reducer;

export const $release = (state: RootState) => state.release;
export const $releaseCurrency = createSelector(
  $release,
  (release) => release.currency
);

