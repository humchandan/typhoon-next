"use client";

import React from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect } from "wagmi/connectors";
import { appChain, SUPPORTED_CHAIN_ID } from "@/config/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;

const wagmiConfig = createConfig({
  chains: [appChain],
  connectors: [
    injected({
      target: "metaMask",
    }),
    walletConnect({ 
      projectId,
      showQrModal: true,
    }),
  ],
  transports: {
    [SUPPORTED_CHAIN_ID]: http(rpcUrl),
  },
});

const queryClient = new QueryClient();

export function WagmiWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
