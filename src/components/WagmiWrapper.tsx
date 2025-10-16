"use client";

import React from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;

const wagmiConfig = createConfig({
  chains: [avalancheFuji],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [avalancheFuji.id]: http(rpcUrl),
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
