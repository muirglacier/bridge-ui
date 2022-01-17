const NETWORK = process.env.REACT_APP_NETWORK || "mainnet";
const INFURA_ID = process.env.REACT_APP_INFURA_ID || "";
const BANDCHAIN_ENDPOINT =
  process.env.REACT_APP_BANDCHAIN_ENDPOINT || "https://laozi1.bandchain.org/api";
const GAS_FEE_ENDPOINT =
  process.env.REACT_APP_GAS_FEE_ENDPOINT ||
  "https://api.anyblock.tools/ethereum/latest-minimum-gasprice/?pretty";
const ETHEREUM_BACKEND_ENDPOINT =
  process.env.ETHEREUM_BACKEND_ENDPOINT ||
  "http://localhost:8080";
const BSC_BACKEND_ENDPOINT =
  process.env.BSC_BACKEND_ENDPOINT ||
  "http://localhost:9080";
const FIREBASE_KEY = process.env.REACT_APP_FIREBASE_KEY || null;
const FIREBASE_PROJECT_ID =
  process.env.REACT_APP_FIREBASE_PROJECT_ID || "ren-auth";

export const DEV = Boolean(false);// Boolean(process.env.NODE_ENV === "development");

const XSTATE_DEVTOOLS = Boolean(false); //(process.env.REACT_APP_XSTATE_DEVTOOLS || DEV);

const MEWCONNECT_ENABLED = Boolean(process.env.REACT_APP_MEWCONNECT_ENABLED);
const WALLETCONNECT_ENABLED = Boolean(
  process.env.REACT_APP_WALLETCONNECT_ENABLED
);
const BSC_MM_ENABLED = true;

const ETH_CONTRACT_ADDRESS = "0xc5b225271519EF55Fcfe712572b6192fEcB46d76";
const BSC_CONTRACT_ADDRESS = "";


export const env = {
  DEV,
  NETWORK,
  INFURA_ID,
  FIREBASE_KEY,
  FIREBASE_PROJECT_ID,
  BANDCHAIN_ENDPOINT,
  GAS_FEE_ENDPOINT,
  XSTATE_DEVTOOLS,
  BSC_MM_ENABLED,
  MEWCONNECT_ENABLED,
  WALLETCONNECT_ENABLED,
  ETHEREUM_BACKEND_ENDPOINT,
  BSC_BACKEND_ENDPOINT,
  ETH_CONTRACT_ADDRESS,
  BSC_CONTRACT_ADDRESS,
  
};

if (DEV) console.debug("env", env, process);
