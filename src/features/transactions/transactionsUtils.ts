import { BottomNavigationClassKey } from "@material-ui/core";
import { RenNetwork } from "@renproject/interfaces";
import { GatewaySession } from "@renproject/ren-tx";
import queryString from "query-string";
import { useLocation } from "react-router-dom";
import { chainsClassMap } from "../../services/rentx";
import {
  BridgeChain,
  BridgeCurrency,
  getChainConfig,
  getCurrencyConfig,
  getCurrencyConfigByRentxName,
} from "../../utils/assetConfigs";
import { toPercent } from "../../utils/converters";
import { isMintTransactionCompleted } from "../mint/mintUtils";
import { isReleaseTransactionCompleted } from "../release/releaseUtils";

export enum TxEntryStatus {
  PENDING = "pending",
  ACTION_REQUIRED = "action_required",
  COMPLETED = "completed",
  EXPIRED = "expired",
  NONE = "",
}

export enum TxPhase {
  LOCK = "lock",
  MINT = "mint",
  BURN = "burn",
  RELEASE = "release",
  NONE = "",
}

export type TxMeta = {
  status: TxEntryStatus;
  phase: TxPhase;
  createdTimestamp: number;
  transactionsCount: number;
};

export enum DepositPhase {
  LOCK = "lock",
  MINT = "mint",
  NONE = "",
}

export enum DepositEntryStatus {
  PENDING = "pending",
  ACTION_REQUIRED = "action_required",
  COMPLETED = "completed",
  EXPIRED = "expired",
}

export type DepositMeta = {
  status: DepositEntryStatus;
  phase: DepositPhase;
};

export enum TxType {
  MINT = "mint",
  BURN = "burn",
}

export enum TxConfigurationStep {
  INITIAL = "initial",
  FEES = "fees",
}

export type TxConfigurationStepProps = {
  onPrev?: () => void;
  onNext?: () => void;
};

export type LocationTxState = {
  txState?: {
    newTx?: boolean;
    reloadTx?: boolean;
  };
};

export const useTxParam = () => {
  const location = useLocation();
  const tx = parseTxQueryString(location.search);
  const locationState = location.state as LocationTxState;

  return { tx, txState: locationState?.txState };
};

export const createTxQueryString = (tx: GatewaySession) => {
  const { customParams, transactions, ...sanitized } = tx as any;

  // These were broken previously and should not be part of the tx object
  delete sanitized.meta;
  delete sanitized.created;
  delete sanitized.updated;

  const stringResult = queryString.stringify({
    ...sanitized,
    customParams: JSON.stringify(customParams),
    transactions: JSON.stringify(transactions),
  } as any);

  if (stringResult.includes("[object Object]")) {
    throw new Error("Failed to serialize tx");
  }
  return stringResult;
};

const parseNumber = (value: any) => {
  if (typeof value === "undefined") {
    return undefined;
  }
  return Number(value);
};

export const isTxExpired = (tx: GatewaySession) => {
  return Date.now() > tx.expiryTime;
};

export const txCompletedSorter = (a: GatewaySession, b: GatewaySession) => {
  const aCompleted = isTransactionCompleted(a);
  const bCompleted = isTransactionCompleted(b);
  if (aCompleted && !bCompleted) {
    return 1;
  } else if (!aCompleted && bCompleted) {
    return -1;
  }
  return txExpirySorter(a, b);
};

export const txExpirySorter = (
  a: Partial<GatewaySession>,
  b: Partial<GatewaySession>
) => {
  if (a.expiryTime && b.expiryTime) {
    return b.expiryTime - a.expiryTime;
  }
  return 0;
};

export const cloneTx = (tx: GatewaySession) =>
  JSON.parse(JSON.stringify(tx)) as GatewaySession;

type ParsedGatewaySession = GatewaySession & {
  depositHash?: string;
  depositN?: number;
  confirmations?: number;
  good?: boolean;
  in_flight?: boolean;
};

export const parseTxQueryString: (
  query: string
) => Partial<ParsedGatewaySession> | null = (query: string) => {
  const parsed = queryString.parse(query);
  if (!parsed) {
    return null;
  }
  const {
    expiryTime,
    suggestedAmount,
    targetAmount,
    transactions,
    customParams,
    createdAt,
    ...rest
  } = parsed;

  return {
    ...rest,
    transactions: JSON.parse((transactions as string) || "{}"),
    customParams: JSON.parse((customParams as string) || "{}"),
    expiryTime: parseNumber(expiryTime),
    createdAt: parseNumber(createdAt),
    suggestedAmount: parseNumber(suggestedAmount),
    targetAmount: parseNumber(targetAmount),
  };
};

export const getChainExplorerLink = (
  chain: BridgeChain,
  network: RenNetwork | "testnet" | "mainnet",
  txId: string
) => {
  if (!txId) {
    return "";
  }
  const chainConfig = getChainConfig(chain);
  return (chainsClassMap as any)[
    chainConfig.rentxName
  ].utils.transactionExplorerLink(txId, network);
};

export const getAddressExplorerLink = (
  chain: BridgeChain,
  network: RenNetwork | "testnet" | "mainnet",
  address: string
) => {
  if (!address) {
    return "";
  }
  const chainConfig = getChainConfig(chain);
  return (chainsClassMap as any)[
    chainConfig.rentxName
  ].utils.addressExplorerLink(address, network);
};

type GetFeeTooltipsArgs = {
  mintFee: number;
  releaseFee: number;
  sourceCurrency: BridgeCurrency;
  chain: BridgeChain;
};

export const getFeeTooltips = ({
  mintFee,
  releaseFee,
  sourceCurrency,
  chain,
}: GetFeeTooltipsArgs) => {
  const sourceCurrencyConfig = getCurrencyConfig(sourceCurrency);
  const sourceCurrencyChainConfig = getChainConfig(
    sourceCurrencyConfig.sourceChain
  );
  const renCurrencyChainConfig = getChainConfig(chain);
  const renNativeChainCurrencyConfig = getCurrencyConfig(
    renCurrencyChainConfig.nativeCurrency
  );
  return {
    renVmFee: `RenVM takes a ${toPercent(
      mintFee
    )}% fee per mint transaction and ${toPercent(
      releaseFee
    )}% per burn transaction. This is shared evenly between all active nodes in the decentralized network.`,
    sourceChainMinerFee: `The fee required by ${sourceCurrencyChainConfig.full} miners, to move ${sourceCurrencyConfig.short}. This does not go RenVM or the Ren team.`,
    renCurrencyChainFee: `The estimated cost to perform a transaction on the ${renCurrencyChainConfig.full} network. This fee goes to ${renCurrencyChainConfig.short} miners and is paid in ${renNativeChainCurrencyConfig.short}.`,
  };
};

export const getTxPageTitle = (tx: GatewaySession) => {
  const amount = tx.targetAmount;
  const asset = getCurrencyConfigByRentxName(tx.sourceAsset).short;
  const type = tx.type === TxType.MINT ? "Mint" : "Release";
  const date = new Date(getTxCreationTimestamp(tx)).toISOString();

  return `${type} - ${asset}`;
};

export const getTxCreationTimestamp = (tx: GatewaySession) =>
  tx.createdAt || tx.expiryTime - 24 * 3600 * 1000 * 3;

export const getPaymentLink = (
  chain: BridgeChain,
  address: string,
  amount: number
) => {
  const chainConfig = getChainConfig(chain);
  return `${address}`;
};

export const isTransactionCompleted = (tx: GatewaySession) => {
  return tx.type === TxType.MINT
    ? isMintTransactionCompleted(tx)
    : isReleaseTransactionCompleted(tx);
};

export const isMinimalAmount = (
  amount: number,
  receiving: number,
  type: TxType
) => {
  if (type === TxType.BURN) {
    return receiving > 0;
  }
  return receiving / amount >= 0.5;
};

export const base64ToHex = (hash: string) =>
  Buffer.from(hash, "base64").toString("hex");
