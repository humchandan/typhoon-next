"use client";

import React, { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

// Import your contract ABI
import contractAbi from "@/contracts/TyphoonABI.json";

// Get contract address from env
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

interface SetReferrerProps {
  sponsorReferralId: string;
}

export function SetReferrerComponent({ sponsorReferralId }: SetReferrerProps) {
  const [sponsorWallet, setSponsorWallet] = useState<string | null>(null);
  const [loadingSponsor, setLoadingSponsor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wagmi v2 correct usage
  const { 
     hash, 
    writeContract, 
    isPending, 
    error: writeError 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash 
  });

  // Fetch sponsor wallet address from backend API
  useEffect(() => {
    async function fetchSponsor() {
      setLoadingSponsor(true);
      setError(null);
      try {
        const res = await fetch(`/api/user/byReferralId/${sponsorReferralId}`);
        if (!res.ok) throw new Error("Sponsor not found");
        const sponsor = await res.json();
        setSponsorWallet(sponsor.walletAddress);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoadingSponsor(false);
      }
    }

    if (sponsorReferralId) {
      fetchSponsor();
    }
  }, [sponsorReferralId]);

  // Handle button click to send the setReferrer tx
  function handleSetReferrer() {
    if (sponsorWallet && contractAddress) {
      writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "setReferrer",
        args: [sponsorWallet as `0x${string}`],
      });
    }
  }

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", margin: "20px 0" }}>
      <h3>Set Your Referrer On-Chain</h3>
      
      {loadingSponsor && <p>Loading sponsor info...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {writeError && <p style={{ color: "red" }}>Error: {writeError.message}</p>}

      {!loadingSponsor && sponsorWallet && !isConfirmed && (
        <div>
          <p><strong>Sponsor Wallet:</strong> {sponsorWallet}</p>
          <button 
            onClick={handleSetReferrer} 
            disabled={isPending || isConfirming}
            style={{
              padding: "10px 20px",
              backgroundColor: isPending || isConfirming ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              cursor: isPending || isConfirming ? "not-allowed" : "pointer"
            }}
          >
            {isPending ? "Check Wallet..." : isConfirming ? "Confirming..." : "Set Referrer On-Chain"}
          </button>
        </div>
      )}

      {isConfirmed && hash && (
        <div style={{ color: "green", marginTop: "10px" }}>
          <p>✅ Referrer set successfully!</p>
          <p>Transaction Hash: <code>{hash}</code></p>
        </div>
      )}
    </div>
  );
}
