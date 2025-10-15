"use client";
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const injectedConnector = connectors.find(c => c.id === 'injected');
  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect');

  const handleConnectInjected = () => {
    if (injectedConnector) connect({ connector: injectedConnector });
  };

  const handleConnectWalletConnect = () => {
    if (walletConnectConnector) connect({ connector: walletConnectConnector });
  };

  if (!isConnected) {
    return (
      <div className="flex gap-4">
        <button
          onClick={handleConnectInjected}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg text-lg font-semibold"
        >
          Connect MetaMask/Core Wallet
        </button>
        <button
          onClick={handleConnectWalletConnect}
          className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg text-lg font-semibold"
        >
          Connect WalletConnect
        </button>
      </div>
    );
  }

  return (
    <div>
      Connected: {address.slice(0, 6)}...{address.slice(-4)}
      <button
        onClick={disconnect}
        className="ml-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Disconnect
      </button>
    </div>
  );
}
