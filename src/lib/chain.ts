import { createPublicClient, defineChain, fallback, http } from "viem";

const configuredChainId = Number(import.meta.env.VITE_CHAIN_ID || 10143);
const isMainnet = configuredChainId === 143;
const configuredRpc =
  import.meta.env.VITE_RPC_URL ||
  (isMainnet ? "https://rpc.monad.xyz" : "https://rpc.ankr.com/monad_testnet");
const rpcUrls = isMainnet
  ? [configuredRpc]
  : [...new Set([
      configuredRpc,
      "https://monad-testnet.api.onfinality.io/public",
      "https://rpc-testnet.monadinfra.com",
    ])];

export const bringBackChain = defineChain({
  id: configuredChainId,
  name: isMainnet ? "Monad Mainnet" : "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: rpcUrls,
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
  ccipRead: false,
  transport: fallback(
    rpcUrls.map((url) => http(url, { retryCount: 1, timeout: 10_000 })),
    { rank: false },
  ),
});

export const explorerUrl = bringBackChain.blockExplorers.default.url;
