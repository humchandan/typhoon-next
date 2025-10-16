"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import contractAbi from "@/contracts/TyphoonABI.json";
import { useChainValidation } from "@/hooks/useChainValidation";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const inrtTokenAddress = process.env.NEXT_PUBLIC_INRT_TOKEN_ADDRESS as `0x${string}`;

// INRT uses 6 decimals
const INRT_DECIMALS = 6;
// Approve 10 million INRT (one-time approval)
const APPROVAL_AMOUNT = parseUnits("10000000", INRT_DECIMALS);

const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

export default function InvestPage() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<"approve" | "purchase">("approve");
  const [mounted, setMounted] = useState(false);

  const { isWrongChain, switchToCorrectChain, currentChainId, expectedChainId } = useChainValidation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const priceRead: any = useReadContract({
    address: contractAddress,
    abi: contractAbi as any,
    functionName: "pricePerSnowballINRT",
  });

  const blockCountRead: any = useReadContract({
    address: contractAddress,
    abi: contractAbi as any,
    functionName: "blockCount",
  });

  const snowballsRead: any = useReadContract({
    address: contractAddress,
    abi: contractAbi as any,
    functionName: "snowballRemainingPerBlock",
    args: blockCountRead.data ? [blockCountRead.data] : undefined,
  });

  const balanceRead: any = useReadContract({
    address: inrtTokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const allowanceRead: any = useReadContract({
    address: inrtTokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && contractAddress ? [address, contractAddress] : undefined,
  });

  const approveContract: any = useWriteContract();
  const purchaseContract: any = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = 
    useWaitForTransactionReceipt({ hash: approveContract.data });

  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseSuccess } = 
    useWaitForTransactionReceipt({ hash: purchaseContract.data });

  const pricePerSnowball = priceRead.data;
  const blockCount = blockCountRead.data;
  const currentBlockSnowballs = snowballsRead.data;
  const inrtBalance = balanceRead.data;
  const allowance = allowanceRead.data;

  // Calculate total cost using INRT's 6 decimals
  const totalCost = pricePerSnowball ? BigInt(quantity) * BigInt(pricePerSnowball) : BigInt(0);

  useEffect(() => {
    if (pricePerSnowball) {
      console.log("✅ Price loaded:", formatUnits(BigInt(pricePerSnowball), INRT_DECIMALS), "INRT");
      console.log("✅ Total cost:", formatUnits(totalCost, INRT_DECIMALS), "INRT");
    }
  }, [pricePerSnowball, totalCost]);

  useEffect(() => {
    if (allowance && totalCost > 0) {
      // If allowance is sufficient, skip to purchase step
      if (BigInt(allowance) >= totalCost) {
        setStep("purchase");
      } else {
        setStep("approve");
      }
    }
  }, [allowance, totalCost]);

  useEffect(() => {
    if (isPurchaseSuccess) {
      setQuantity(1);
      setTimeout(() => window.location.reload(), 2000);
    }
  }, [isPurchaseSuccess]);

  const handleApprove = () => {
    if (isWrongChain) {
      alert(`Wrong network! Switch to Chain ID ${expectedChainId}`);
      switchToCorrectChain();
      return;
    }

    if (!pricePerSnowball) {
      alert("Loading price...");
      return;
    }

    console.log("🔵 Approving 10,000,000 INRT");
    
    // Approve 10 million INRT (one-time approval)
    approveContract.writeContract({
      address: inrtTokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [contractAddress, APPROVAL_AMOUNT],
    });
  };

  const handlePurchase = async () => {
    if (isWrongChain) {
      alert(`Wrong network! Switch to Chain ID ${expectedChainId}`);
      switchToCorrectChain();
      return;
    }

    // Check if user has sufficient balance
    if (inrtBalance && BigInt(inrtBalance) < totalCost) {
      alert(`Insufficient INRT! You need ${formatUnits(totalCost, INRT_DECIMALS)} INRT but only have ${formatUnits(BigInt(inrtBalance), INRT_DECIMALS)} INRT`);
      return;
    }

    try {
      const userRes = await fetch(`/api/user/getByWallet?walletAddress=${address}`);
      const userData = await userRes.json();

      if (!userData.error) {
        await fetch("/api/purchase/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userData.id,
            walletAddress: address,
            snowballsPurchased: quantity,
            totalBlockSize: quantity,
            blockNumber: blockCount ? Number(blockCount) : 0,
          }),
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }

    purchaseContract.writeContract({
      address: contractAddress,
      abi: contractAbi as any,
      functionName: "purchaseWithINRT",
      args: [BigInt(quantity)],
    });
  };

  if (!mounted) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#fff" }}><h1>Loading...</h1></div>;
  }

  if (!isConnected) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#fff" }}><h1>Please connect your wallet</h1></div>;
  }

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ color: "#fff", fontSize: "2.5rem", marginBottom: "30px", textAlign: "center" }}>
        💰 Purchase Snowballs
      </h1>

      {isWrongChain && (
        <div style={{
          padding: "25px",
          backgroundColor: "#ef4444",
          color: "white",
          borderRadius: "12px",
          marginBottom: "30px",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
        }}>
          <p style={{ margin: "0 0 15px 0", fontWeight: "bold", fontSize: "1.2rem" }}>⚠️ Wrong Network!</p>
          <p style={{ margin: "0 0 15px 0" }}>Chain ID: {currentChainId} → Need: {expectedChainId}</p>
          <button onClick={switchToCorrectChain} style={{
            padding: "12px 30px",
            backgroundColor: "white",
            color: "#ef4444",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem"
          }}>
            Switch Network
          </button>
        </div>
      )}

      {/* Block Info */}
      <div style={{
        padding: "25px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        marginBottom: "25px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
      }}>
        <h3 style={{ color: "#60a5fa", marginBottom: "15px" }}>📊 Current Block Information</h3>
        <p style={{ color: "#e5e7eb", margin: "8px 0" }}>
          <strong style={{ color: "#fff" }}>Block Number:</strong> {blockCount?.toString() || "Loading..."}
        </p>
        <p style={{ color: "#e5e7eb", margin: "8px 0" }}>
          <strong style={{ color: "#fff" }}>Snowballs Remaining:</strong> {currentBlockSnowballs?.toString() || "Loading..."}
        </p>
        <p style={{ color: "#e5e7eb", margin: "8px 0" }}>
          <strong style={{ color: "#fff" }}>Price per Snowball:</strong> {pricePerSnowball ? formatUnits(BigInt(pricePerSnowball), INRT_DECIMALS) : "Loading..."} INRT
        </p>
      </div>

      {/* Balance */}
      <div style={{
        padding: "25px",
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        borderRadius: "12px",
        marginBottom: "25px",
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)"
      }}>
        <h3 style={{ color: "#fff", marginBottom: "10px" }}>💎 Your INRT Balance</h3>
        <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#fff", margin: 0 }}>
          {inrtBalance ? formatUnits(BigInt(inrtBalance), INRT_DECIMALS) : "0"} INRT
        </p>
      </div>

      {/* Purchase Form */}
      <div style={{
        padding: "35px",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        border: "2px solid rgba(59, 130, 246, 0.3)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)"
      }}>
        <h2 style={{ color: "#fff", marginBottom: "25px", textAlign: "center" }}>Purchase Snowballs</h2>
        
        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "12px", fontSize: "1.1rem", color: "#e5e7eb", fontWeight: "500" }}>
            Quantity (1 - 1000 snowballs):
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "1.3rem",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: "#1a1a2e",
              fontWeight: "600"
            }}
          />
          <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem", color: "#9ca3af" }}>
            Maximum 1000 snowballs per transaction
          </p>
        </div>

        <div style={{
          padding: "20px",
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          borderRadius: "10px",
          marginBottom: "25px",
          textAlign: "center"
        }}>
          <p style={{ margin: 0, fontSize: "1.4rem", color: "#fff", fontWeight: "bold" }}>
            Total Cost: {pricePerSnowball ? formatUnits(totalCost, INRT_DECIMALS) : "..."} INRT
          </p>
        </div>

        {step === "approve" ? (
          <button
            onClick={handleApprove}
            disabled={approveContract.isPending || isApproveConfirming || !pricePerSnowball}
            style={{
              width: "100%",
              padding: "18px",
              fontSize: "1.3rem",
              backgroundColor: !pricePerSnowball ? "#6b7280" : (approveContract.isPending || isApproveConfirming ? "#6b7280" : "#fbbf24"),
              color: !pricePerSnowball ? "#fff" : "#1a1a2e",
              border: "none",
              borderRadius: "10px",
              cursor: (!pricePerSnowball || approveContract.isPending || isApproveConfirming) ? "not-allowed" : "pointer",
              fontWeight: "bold",
              boxShadow: !pricePerSnowball ? "none" : "0 4px 12px rgba(251, 191, 36, 0.4)"
            }}
          >
            {!pricePerSnowball ? "⏳ Loading Price..." : (approveContract.isPending ? "Check Wallet..." : isApproveConfirming ? "Approving..." : "1️⃣ Approve 10M INRT (One-Time)")}
          </button>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={purchaseContract.isPending || isPurchaseConfirming}
            style={{
              width: "100%",
              padding: "18px",
              fontSize: "1.3rem",
              backgroundColor: (purchaseContract.isPending || isPurchaseConfirming) ? "#6b7280" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: (purchaseContract.isPending || isPurchaseConfirming) ? "not-allowed" : "pointer",
              fontWeight: "bold",
              boxShadow: (purchaseContract.isPending || isPurchaseConfirming) ? "none" : "0 4px 12px rgba(16, 185, 129, 0.4)"
            }}
          >
            {purchaseContract.isPending ? "Check Wallet..." : isPurchaseConfirming ? "Purchasing..." : "2️⃣ Purchase Snowballs"}
          </button>
        )}

        {isApproveSuccess && (
          <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "rgba(16, 185, 129, 0.2)", borderRadius: "8px", border: "1px solid #10b981" }}>
            <p style={{ margin: 0, color: "#10b981", fontWeight: "bold", fontSize: "1.1rem" }}>✅ Approved 10M INRT! Now click Purchase.</p>
          </div>
        )}

        {isPurchaseSuccess && (
          <div style={{ marginTop: "20px", padding: "20px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "8px" }}>
            <p style={{ margin: 0, color: "#fff", fontSize: "1.3rem", fontWeight: "bold", textAlign: "center" }}>
              🎉 Purchase Successful! Refreshing...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
