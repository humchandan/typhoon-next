"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import contractAbi from "@/contracts/TyphoonABI.json";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const inrtTokenAddress = process.env.NEXT_PUBLIC_INRT_TOKEN_ADDRESS as `0x${string}`;

// IERC20 ABI for approve function
const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
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

  // Read contract data
  const {  pricePerSnowball } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "pricePerSnowballINRT",
  });

  const {  blockCount } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "blockCount",
  });

  const {  currentBlockSnowballs } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "snowballRemainingPerBlock",
    args: blockCount ? [blockCount] : undefined,
  });

  const {  inrtBalance } = useReadContract({
    address: inrtTokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const {  allowance } = useReadContract({
    address: inrtTokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && contractAddress ? [address, contractAddress] : undefined,
  });

  // Write contracts
  const { 
     approveHash, 
    writeContract: approveWrite, 
    isPending: isApprovePending 
  } = useWriteContract();

  const { 
     purchaseHash, 
    writeContract: purchaseWrite, 
    isPending: isPurchasePending 
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = 
    useWaitForTransactionReceipt({ hash: approveHash });

  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseSuccess } = 
    useWaitForTransactionReceipt({ hash: purchaseHash });

  // Calculate total cost
  const totalCost = pricePerSnowball 
    ? BigInt(quantity) * (pricePerSnowball as bigint)
    : BigInt(0);

  // Check if approval is needed
  useEffect(() => {
    if (allowance && totalCost > 0) {
      if ((allowance as bigint) >= totalCost) {
        setStep("purchase");
      } else {
        setStep("approve");
      }
    }
  }, [allowance, totalCost]);

  // Reset after successful purchase
  useEffect(() => {
    if (isPurchaseSuccess) {
      setQuantity(1);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isPurchaseSuccess]);

  const handleApprove = () => {
    if (!inrtTokenAddress || !contractAddress) return;
    approveWrite({
      address: inrtTokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [contractAddress, totalCost],
    });
  };

  const handlePurchase = async () => {
    if (!contractAddress) return;

    // Record purchase in database
    try {
      const userRes = await fetch(`/api/user/getByWallet?walletAddress=${address}`);
      const userData = await userRes.json();

      if (!userData.error) {
        // Create purchase record
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
      console.error("Error recording purchase:", error);
    }

    // Execute on-chain purchase
    purchaseWrite({
      address: contractAddress,
      abi: contractAbi,
      functionName: "purchaseWithINRT",
      args: [BigInt(quantity)],
    });
  };

  if (!isConnected) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Please connect your wallet to invest</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>💰 Purchase Snowballs</h1>

      {/* Current Block Info */}
      <div style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "10px",
        marginBottom: "30px"
      }}>
        <h3>Current Block Information</h3>
        <p><strong>Block Number:</strong> {blockCount?.toString() || "0"}</p>
        <p><strong>Snowballs Remaining:</strong> {currentBlockSnowballs?.toString() || "0"}</p>
        <p><strong>Price per Snowball:</strong> {pricePerSnowball ? formatUnits(pricePerSnowball as bigint, 18) : "0"} INRT</p>
      </div>

      {/* Your Balance */}
      <div style={{
        padding: "20px",
        backgroundColor: "#e7f3ff",
        borderRadius: "10px",
        marginBottom: "30px"
      }}>
        <h3>Your INRT Balance</h3>
        <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          {inrtBalance ? formatUnits(inrtBalance as bigint, 18) : "0"} INRT
        </p>
      </div>

      {/* Purchase Form */}
      <div style={{
        padding: "30px",
        border: "2px solid #007bff",
        borderRadius: "10px",
        backgroundColor: "white"
      }}>
        <h2>Purchase Snowballs</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontSize: "1.1rem" }}>
            Quantity (max 50 per block):
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            style={{
              width: "100%",
              padding: "15px",
              fontSize: "1.2rem",
              border: "2px solid #ddd",
              borderRadius: "8px"
            }}
          />
        </div>

        <div style={{
          padding: "15px",
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <p style={{ margin: 0, fontSize: "1.2rem" }}>
            <strong>Total Cost:</strong> {formatUnits(totalCost, 18)} INRT
          </p>
        </div>

        {step === "approve" ? (
          <button
            onClick={handleApprove}
            disabled={isApprovePending || isApproveConfirming}
            style={{
              width: "100%",
              padding: "15px",
              fontSize: "1.2rem",
              backgroundColor: isApprovePending || isApproveConfirming ? "#6c757d" : "#ffc107",
              color: "black",
              border: "none",
              borderRadius: "8px",
              cursor: isApprovePending || isApproveConfirming ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {isApprovePending ? "Check Wallet..." : isApproveConfirming ? "Approving..." : "1. Approve INRT"}
          </button>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={isPurchasePending || isPurchaseConfirming}
            style={{
              width: "100%",
              padding: "15px",
              fontSize: "1.2rem",
              backgroundColor: isPurchasePending || isPurchaseConfirming ? "#6c757d" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isPurchasePending || isPurchaseConfirming ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {isPurchasePending ? "Check Wallet..." : isPurchaseConfirming ? "Purchasing..." : "2. Purchase Snowballs"}
          </button>
        )}

        {isApproveSuccess && step === "approve" && (
          <p style={{ marginTop: "15px", color: "green" }}>
            ✅ Approval successful! You can now purchase.
          </p>
        )}

        {isPurchaseSuccess && (
          <p style={{ marginTop: "15px", color: "green", fontSize: "1.2rem" }}>
            🎉 Purchase successful! Redirecting...
          </p>
        )}
      </div>
    </div>
  );
}
