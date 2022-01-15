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

export const buildUrl = (destChain: string) => {
  return env.ETHEREUM_BACKEND_ENDPOINT;
}
export const getDepositAddress = async (userAddress: string, destChain: string) => {
  let url = buildUrl(destChain) + "/deposit/" + userAddress;
  let settings = { method: "Get" };

  return fetch(url, settings).then(res => res.json() as DepositMessage);
};
