import { RenNetwork } from "@renproject/interfaces";
import { useMultiwallet } from "@renproject/multiwallet-ui";
import { env } from "process";
import { env as SS } from "../../constants/environmentVariables";

import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Web3 from "web3";
import { AbiItem } from 'web3-utils'
import {
  WalletConnectionStatusType,
  WalletStatus,
} from "../../components/utils/types";
import { storageKeys } from "../../constants/constants";
import { db } from "../../services/database/database";
import { signWithBinanceChain } from "../../services/wallets/bsc";
import { BridgeWallet, RenChain } from "../../utils/assetConfigs";
import { $renNetwork } from "../network/networkSlice";
import {
  $isAuthenticating,
  $multiwalletChain,
  $walletUser,
  setAuthRequired,
  setSignatures,
  settingUser,
  setUser,
} from "./walletSlice";

type WalletData = ReturnType<typeof useMultiwallet> & {
  account: string;
  status: WalletConnectionStatusType;
  walletConnected: boolean;
  provider: any;
  symbol: BridgeWallet;
  deactivateConnector: () => void;
};

const resolveWallet = (provider: any) => {
  if (provider?.isMetaMask) {
    return BridgeWallet.METAMASKW;
  }

  if (provider?.chainId === "0x61" || provider?.chainId?.indexOf("Binance")) {
    return BridgeWallet.BINANCESMARTW;
  }

  if (provider?.isMewConnect || provider?.isMEWConnect) {
    return BridgeWallet.MEWCONNECTW;
  }

  return BridgeWallet.UNKNOWNW;
};

type UseWallet = (chain: string) => WalletData;

export const useWallet: UseWallet = (chain) => {
  const {
    enabledChains,
    targetNetwork,
    activateConnector,
    setTargetNetwork,
  } = useMultiwallet();
  const { account = "", status = "disconnected" } =
    enabledChains?.[chain] || {};
  const provider = enabledChains?.[chain]?.provider;
  const symbol = resolveWallet(provider);
  const emptyFn = () => {};
  const deactivateConnector =
    enabledChains[chain]?.connector.deactivate || emptyFn;

  return {
    account,
    status,
    walletConnected: status === WalletStatus.CONNECTED,
    provider,
    symbol,
    targetNetwork,
    enabledChains,
    activateConnector,
    setTargetNetwork,
    deactivateConnector,
  } as WalletData;
};

export const useSelectedChainWallet = () => {
  const multiwalletChain = useSelector($multiwalletChain);
  return useWallet(multiwalletChain);
};

export const useSyncMultiwalletNetwork = () => {
  const { targetNetwork, setTargetNetwork } = useSelectedChainWallet();
  const renNetwork = useSelector($renNetwork);
  useEffect(() => {
    if (renNetwork !== targetNetwork) {
      console.info("syncing multiwallet with network", renNetwork);
      setTargetNetwork(
        renNetwork.includes("mainnet")
          ? RenNetwork.Mainnet
          : renNetwork.includes("testnet")
          ? RenNetwork.Testnet
          : renNetwork
      );
    }
  }, [renNetwork, setTargetNetwork, targetNetwork]);
};

const SIGN_MESSAGE = "You are not supposed to do this!!";

const ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "From",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "To",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "Bridge",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "Value",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "Extradata",
        "type": "uint256"
      }
    ],
    "name": "DepositToDefichain",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "spent_outputs",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "supported_bridges",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "new_owner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      }
    ],
    "name": "addNewToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "removeToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "bridge",
        "type": "string"
      }
    ],
    "name": "haveBridge",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "targetAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "txid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "n",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "bridge",
        "type": "string"
      }
    ],
    "name": "messageToSign",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "pure",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "targetAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "txid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "n",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "bridge",
        "type": "string"
      }
    ],
    "name": "hashToSign",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "targetAddress",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bridge",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "burnToken",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "targetAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "txid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "n",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "bridge",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "signature_r",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "signature_s",
        "type": "bytes32"
      },
      {
        "internalType": "uint8",
        "name": "signature_v",
        "type": "uint8"
      }
    ],
    "name": "whoSignedThis",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "pure",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "targetAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "txid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "n",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "bridge",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "signature_r",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "signature_s",
        "type": "bytes32"
      },
      {
        "internalType": "uint8",
        "name": "signature_v",
        "type": "uint8"
      }
    ],
    "name": "mintToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "in_signer",
        "type": "address"
      }
    ],
    "name": "initialize_gateway",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "new_signer",
        "type": "address"
      }
    ],
    "name": "newSigner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "precisionRebase",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "reducePrecision",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "txid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "n",
        "type": "uint256"
      }
    ],
    "name": "manuallySpend",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// TODO TBD: cache for more wallet providers?
const useWeb3 = () => {
  const { provider } = useSelectedChainWallet();
  return useMemo(() => new Web3(provider), [provider]);
};


const sendRedeemTxHook = async (address: string,
  web3: Web3,
  chain: RenChain, targetAddress: string, txid: string, n: number, amount: number, bridge: string, r: string, s: string,v: number) => {    
    return new Promise((resolve, reject) => {

    if ((web3.currentProvider as any).connection.isMetaMask) {
        let myContract = new web3.eth.Contract(ABI as AbiItem[], chain=="ethereum" ? SS.ETH_CONTRACT_ADDRESS : SS.BSC_CONTRACT_ADDRESS);
        myContract.methods.mintToken(targetAddress, txid, n, amount, bridge, r, s, v).send({from: address}).on('transactionHash', resolve)
        .on('error', reject);;
    }
  })
}

const addTokenHook = (web3: Web3, chain: RenChain) => {    
  console.log("Add Token for Network:", chain)
      if ((web3.currentProvider as any).connection.isMetaMask) {
        (web3.currentProvider as any).connection
        .sendAsync({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: chain=="ethereum" ? SS.ETH_TOKEN_ADDRESS : SS.BSC_TOKEN_ADDRESS,
              symbol: 'brDFI',
              decimals: 18,
              image: 'https://cryptologos.cc/logos/defichain-dfi-logo.svg?v=018',
            },
          },
        }, (err: any, added: any) => {
          console.log('provider returned', err, added)
        })
      }
}

const addBinanceChainHook = async (web3: Web3, chain: RenChain) => {    
  
  return new Promise((resolve, reject) => {
    let networkData = [
      {
        chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency:
                {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/'],
      },
    ];
    if ((web3.currentProvider as any).connection.isMetaMask) {
      (web3.currentProvider as any).connection
      .request
      ({
        method: "wallet_addEthereumChain",
        params: networkData,
    
      }, (err: any, added: any) => {
        console.log('provider returned', err, added)
        if (err || 'error' in added) {
            reject("error")
        } else {
            resolve("good")
        }
    })
    }
})
}

const addEthereumChainHook = async (web3: Web3, chain: RenChain) => {    
  return new Promise((resolve, reject) => {
    let networkData = [
      {
        chainId: '0x1',
      },
    ];
    if ((web3.currentProvider as any).connection.isMetaMask) {
      (web3.currentProvider as any).connection
      .request
      ({
        method: "wallet_switchEthereumChain",
        params: networkData,
    
      }, (err: any, added: any) => {
        console.log('provider returned', err, added)
        if (err || 'error' in added) {
            reject("error")
        } else {
            resolve("good")
        }
    })
    }
})
}

const sendBurnTxHook = async (address: string,
  web3: Web3,
  chain: RenChain, targetAddress: string, amount: bigint, bridge: string) => {    

  return new Promise((resolve, reject) => {
    if ((web3.currentProvider as any).connection.isMetaMask) {
        let myContract = new web3.eth.Contract(ABI as AbiItem[], chain=="ethereum" ? SS.ETH_CONTRACT_ADDRESS : SS.BSC_CONTRACT_ADDRESS);
        let response = myContract.methods.burnToken(targetAddress, bridge, "0x"+amount.toString(16)).send({from: address}).on('transactionHash', resolve)
        .on('error', reject);;
    }
  })
}

export const useRedeem = () => {
  const chain = useSelector($multiwalletChain);
  const { account, status } = useWallet(chain);
  const web3 = useWeb3();
  const dispatch = useDispatch();
  const getSignatures = useCallback(async (targetAddress: string, txid: string, n: number, amount: number, bridge: string, r: string, s: string,v: number) => {
    amount = amount - 0.01*100000000 // TODO make 0.1 fee variable
    if (account && web3 && status === "connected") {
      try {
        console.log(targetAddress, txid, n, amount, bridge.toUpperCase(), r, s, v)
        const signatures = await sendRedeemTxHook(account, web3, chain, targetAddress, txid, n, amount, bridge.toUpperCase(), r, s, v);
        return {err:null, result:signatures}
      } catch (error) {
        return {err:error, result:null};
      }
    }
    return {err:{code:-1, message:"something went wrong"}, result:null}
  }, [account, web3, status, chain, dispatch]);

  return { getSignatures };
};

export const useToken = () => {
  const chain = useSelector($multiwalletChain);
  const web3 = useWeb3();
  const getToken = useCallback(() => {
    if (web3) {
      addTokenHook(web3, chain)
    }
  }, [web3, chain]);

  return { getToken };
};

export const useAddBsc = (chainname: string) => {
  const chain = useSelector($multiwalletChain);
  const { account, status } = useWallet(chain);
  const web3 = useWeb3();
  const dispatch = useDispatch();
  const updateBsc = useCallback(async () => {
    if (web3) {
      try {
        if(chainname=="Ethereum"){
            const signatures = await addEthereumChainHook(web3, chain);
            return {err:null, result:signatures}
        }else{
            const signatures = await addBinanceChainHook(web3, chain);
            return {err:null, result:signatures}
        }
      } catch (error) {
        return {err:error, result:null};
      }
    }
    return {err:{code:-1, message:"something went wrong"}, result:null}
  }, [account, web3, status, chain, dispatch]);

  return { updateBsc };
};


export const useBurn = () => {
  const chain = useSelector($multiwalletChain);
  const { account, status } = useWallet(chain);
  const web3 = useWeb3();
  const dispatch = useDispatch();
  const getBurn = useCallback(async (targetAddress: string, amount: number, bridge: string) => {
    // TODO FIX THIS SHIT amount = amount*1000000000000000000 - 0.1*1000000000000000000 // TODO make 0.1 fee variable
    var amount_bgint = BigInt(web3.utils.toWei(amount.toString(), 'ether'))
    
    if (account && web3 && status === "connected") {
      try {
        const signatures = await sendBurnTxHook(account, web3, chain, targetAddress, amount_bgint, bridge.toUpperCase());
        return {err:null, result:signatures}
      } catch (error) {
        return {err:error, result:null};
      }
    }
    return {err:{code:-1, message:"something went wrong"}, result:null}
  }, [account, web3, status, chain, dispatch]);

  return { getBurn };
};

const getWeb3Signatures = async (
  address: string,
  web3: Web3,
  chain: RenChain
) => {
  const localSigMap = JSON.parse(
    localStorage.getItem(storageKeys.SIG_MAP) || "{}"
  );
  const localRawSigMap = JSON.parse(
    localStorage.getItem(storageKeys.RAW_SIG_MAP) || "{}"
  );
  const addressLowerCase = address.toLowerCase();

  let signature: string = localSigMap[addressLowerCase] || "";
  let rawSignature: string = localRawSigMap[addressLowerCase] || "";

  if (!signature || !rawSignature) {
    // get unique wallet signature for database backup
    if (
      chain === RenChain.ethereum ||
      // signing is actually based on wallet, not chain,
      // so use this style if the provider is eth
      // TODO: move signing functionality into multiwallet?
      (web3.currentProvider as any).connection.isMetaMask
    ) {
      console.info("signing");
      rawSignature = await web3.eth.personal.sign(
        web3.utils.utf8ToHex(SIGN_MESSAGE),
        addressLowerCase,
        ""
      );
    } else if (chain === RenChain.binanceSmartChain) {
      rawSignature = await signWithBinanceChain(SIGN_MESSAGE);
    }

    localRawSigMap[addressLowerCase] = rawSignature;
    localStorage.setItem(
      storageKeys.RAW_SIG_MAP,
      JSON.stringify(localRawSigMap)
    );

    signature = web3.utils.sha3(rawSignature);
    localSigMap[addressLowerCase] = signature;
    localStorage.setItem(storageKeys.SIG_MAP, JSON.stringify(localSigMap));
  }
  return { signature, rawSignature };
};

export const useSignatures = () => {
  const dispatch = useDispatch();
  const chain = useSelector($multiwalletChain);
  const { account, status } = useWallet(chain);
  const web3 = useWeb3();
  const getSignatures = useCallback(async () => {
    console.debug("reauth");
    if (account && web3 && status === "connected") {
      /*try {
        const signatures = await getWeb3Signatures(account, web3, chain);
        dispatch(setSignatures(signatures));
        console.debug("account", account);
        dispatch(settingUser());
        const userData = await db.getUser(account.toLowerCase(), signatures);
        dispatch(setUser(userData));
      } catch (error) {
        // FIXME: dispatch some error here to handle in UI
        console.error(error);
      }*/
    }
  }, [account, web3, status, chain, dispatch]);

  return { getSignatures };
};

export const useWeb3Signatures = () => {
  const { getSignatures } = useSignatures();
  useEffect(() => {
    getSignatures();
  }, [getSignatures]);

  return { getSignatures };
};

export const useAuthentication = () => {
  const { account } = useSelectedChainWallet();
  const user = useSelector($walletUser);
  const isAuthenticating = useSelector($isAuthenticating);
  const { getSignatures } = useSignatures();
  const isAuthenticated = user !== null && account.toLowerCase() === user.uid;

  return { isAuthenticated, isAuthenticating, authenticate: getSignatures };
};

export const useAuthRequired = (authRequired: boolean) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setAuthRequired(authRequired));
    return () => {
      dispatch(setAuthRequired(false));
    };
  }, [dispatch, authRequired]);
};
