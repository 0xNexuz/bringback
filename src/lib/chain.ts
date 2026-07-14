import { createPublicClient, defineChain, http } from "viem";

const configuredChainId = Number(import.meta.env.VITE_CHAIN_ID || 10143);
const isMainnet = configuredChainId === 143;

export const bringBackChain = defineChain({
  id: configuredChainId,
  name: isMainnet ? "Monad Mainnet" : "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_RPC_URL ||
          (isMainnet ? "https://rpc.monad.xyz" : "https://rpc.testnet.monad.xyz"),
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Monadscan",
      url: isMainnet ? "https://monadscan.com" : "https://testnet.monadscan.com",
    },
  },
  testnet: !isMainnet,
});

export const publicClient = createPublicClient({
  chain: bringBackChain,
  transport: http(),
});

export const explorerUrl = bringBackChain.blockExplorers.default.url;
