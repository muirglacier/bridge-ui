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


export const buildUrl = (destChain: string) => {
  return env.ETHEREUM_BACKEND_ENDPOINT;
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
