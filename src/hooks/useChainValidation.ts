import { useAccount, useSwitchChain } from "wagmi";
import { useEffect } from "react";
import { SUPPORTED_CHAIN_ID } from "@/config/chains";

export function useChainValidation() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  const isWrongChain = isConnected && chain?.id !== SUPPORTED_CHAIN_ID;

  useEffect(() => {
    if (isWrongChain && !isPending) {
      console.log(`⚠️ Wrong chain detected: ${chain?.id}, expected: ${SUPPORTED_CHAIN_ID}`);
    }
  }, [isWrongChain, chain?.id, isPending]);

  const handleSwitchChain = () => {
    if (switchChain) {
      switchChain({ chainId: SUPPORTED_CHAIN_ID });
    }
  };

  return {
    isWrongChain,
    currentChainId: chain?.id,
    expectedChainId: SUPPORTED_CHAIN_ID,
    switchToCorrectChain: handleSwitchChain,
    isSwitching: isPending,
  };
}
