import { env } from '../constants/environmentVariables'
import fetch from 'node-fetch';

export class Blame {
        fail_reason?: string
}

export class DepositMessage {
        status?: number
        result?: string
        extra?: string
        blame?: Blame
}

export class Vout {
  txid?: string
  n?: number
  value?: string
  value_satoshi?: number
}

export class DepositEntry {
        vout?: Vout
        current_height?: number;
        tx_height?: number;
        confirmations?: number
        good?: boolean
        good_buffer?: boolean
        destTxHash?: string
}

export class Data {
  data?: DepositEntry[]
}

export class DepositsMessage {
  status?: number
  result?: Data
  extra?: string
  blame?: Blame
}
export class Log {
  From?: string
  To?: string
  Bridge?: string
  Value?: number
  Extradata?: number
}
export class LogsMessage {
  Confirmations?: number
  Executed?: boolean
  Log?: Log
  DefiTx?: string
}

export class Signature {
  signed_msg?: string
  r?: string
  s?: string
  recovery_id?: string
}

export class SignatureMessage {
  status?: number
  signatures?: Signature[]
  blame?: Blame
}

export const buildUrl = (destChain: string) => {
  if (destChain == "ethereum")
    return env.ETHEREUM_BACKEND_ENDPOINT;
  else return env.BSC_BACKEND_ENDPOINT;
}
export const getDepositAddress = async (userAddress: string, destChain: string) => {
  let url = buildUrl(destChain) + "/deposit/" + userAddress;
  let settings = { method: "Get" };

  return fetch(url, settings).then(res => res.json() as DepositMessage);
};

export const getDeposits = async (userAddress: string, destChain: string) => {
  let url = buildUrl(destChain) + "/eligible/" + userAddress;
  let settings = { method: "Get" };
  return fetch(url, settings).then(res => res.json() as DepositsMessage);
};

export const getKeySignatures = async (userAddress: string, txid: string, n: number, destChain: string) => {
  let url = buildUrl(destChain) + "/mint/" + userAddress + "/" + txid + "/" + n;
  console.log(url)
  let settings = { method: "Get" };
  return fetch(url, settings).then(res => res.json() as SignatureMessage);
};

export const getLogs = async (txid: string, destChain: string) => {
  let url = buildUrl(destChain) + "/logs/" + txid;
  let settings = { method: "Get" };
  return fetch(url, settings).then(res => res.json() as LogsMessage);
};