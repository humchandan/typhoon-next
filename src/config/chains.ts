import { Chain } from "wagmi/chains";

const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "43113");
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const CHAIN_NAME = process.env.NEXT_PUBLIC_CHAIN_NAME || "Avalanche Fuji";
const CHAIN_SYMBOL = process.env.NEXT_PUBLIC_CHAIN_SYMBOL || "AVAX";
const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.snowtrace.io";

export const appChain: Chain = {
  id: CHAIN_ID,
  name: CHAIN_NAME,
  nativeCurrency: {
    decimals: 18,
    name: CHAIN_NAME,
    symbol: CHAIN_SYMBOL,
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: EXPLORER_URL },
  },
  testnet: CHAIN_ID === 43113 || CHAIN_ID === 97, // Fuji or BSC Testnet
};

export const SUPPORTED_CHAIN_ID = CHAIN_ID;
