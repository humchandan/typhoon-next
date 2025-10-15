"use client";

import React from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect } from '@wagmi/connectors';

const queryClient = new QueryClient();

const projectId = '4ee7fd7bb097aa1e377bea8703eae0b6';

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    injected(),   // Injected wallets like MetaMask
    walletConnect({ projectId }), // WalletConnect QR modal
  ],
  publicClient: http('https://api.avax-test.network/ext/bc/C/rpc'),
  chains: [avalancheFuji],
});

export function WagmiWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
