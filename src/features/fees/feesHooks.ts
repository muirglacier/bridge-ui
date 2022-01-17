import { useState } from "react";
import { useSelector } from "react-redux";
import { useDebounce } from "react-use";
import {
  getBurnAndReleaseFees,
  getLockAndMintFees,
} from "../../services/rentx";
import { BridgeCurrency } from "../../utils/assetConfigs";
import { $renNetwork } from "../network/networkSlice";
import { TxType } from "../transactions/transactionsUtils";
import { useWallet } from "../wallet/walletHooks";
import { $multiwalletChain } from "../wallet/walletSlice";
import { isSupportedByCurrentNetwork } from "../wallet/walletUtils";
import { SimpleFee } from "./feesUtils";

const feesCache: Record<string, SimpleFee> = {};
export const useFetchFees = (currency: BridgeCurrency, txType: TxType) => {
  const multiwalletChain = useSelector($multiwalletChain);
  const { provider, walletConnected } = useWallet(multiwalletChain);
  const renNetwork = useSelector($renNetwork);
  const initialFees: SimpleFee = {
    mint: 20,
    burn: 20,
    lock: 1000000,
    release: 1000000,
  };
  const [fees, setFees] = useState(initialFees);
  const [pending, setPending] = useState(false);


  return { fees, pending };
};
