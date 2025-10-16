"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import contractAbi from "@/contracts/TyphoonABI.json";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

interface BlockSummary {
  blockId: bigint;
  snowballCount: bigint;
  investedAmount: bigint;
  purchasedSnowballs: bigint;
  purchaseTimestamp: bigint;
}

interface RewardClaim {
  blockId: bigint;
  amount: bigint;
  timestamp: bigint;
}

export default function MyInvestmentsPage() {
  const { address, isConnected } = useAccount();
  const [investmentData, setInvestmentData] = useState<any>(null);

  // Fetch user investment summary from contract
  const {  userSummary, refetch: refetchSummary } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "getUserInvestmentSummary",
    args: address ? [address] : undefined,
  });

  // Fetch pending referral balance
  const {  pendingReferralBalance, refetch: refetchReferral } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "getPendingReferralBalance",
    args: address ? [address] : undefined,
  });

  // Claim referral rewards
  const { 
     claimHash, 
    writeContract: claimWrite, 
    isPending: isClaimPending 
  } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = 
    useWaitForTransactionReceipt({ hash: claimHash });

  useEffect(() => {
    if (userSummary) {
      const [
        totalInvestment,
        blockSummaries,
        userTotalSnowballs,
        rewardStatuses,
        totalRewardGenerated,
        rewardTimestamps,
        totalRewardClaims,
        rewardHistory
      ] = userSummary as any[];

      setInvestmentData({
        totalInvestment,
        blockSummaries,
        userTotalSnowballs,
        rewardStatuses,
        totalRewardGenerated,
        rewardTimestamps,
        totalRewardClaims,
        rewardHistory
      });
    }
  }, [userSummary]);

  useEffect(() => {
    if (isClaimSuccess) {
      refetchReferral();
      refetchSummary();
    }
  }, [isClaimSuccess, refetchReferral, refetchSummary]);

  const handleClaimReferralRewards = () => {
    claimWrite({
      address: contractAddress,
      abi: contractAbi,
      functionName: "claimReferralRewards",
    });
  };

  if (!isConnected) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Please connect your wallet to view investments</h1>
      </div>
    );
  }

  if (!investmentData) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Loading your investments...</h1>
      </div>
    );
  }

  const hasPendingReferrals = pendingReferralBalance && pendingReferralBalance > BigInt(0);

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>📊 My Investments</h1>

      {/* Referral Rewards Claim Section */}
      {hasPendingReferrals && (
        <div style={{
          padding: "25px",
          backgroundColor: "#fff3cd",
          borderRadius: "10px",
          marginBottom: "30px",
          border: "2px solid #ffc107",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ margin: "0 0 10px 0" }}>🎁 Referral Rewards Available</h2>
            <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: "bold", color: "#856404" }}>
              {formatUnits(pendingReferralBalance as bigint, 18)} INRT
            </p>
          </div>
          <button
            onClick={handleClaimReferralRewards}
            disabled={isClaimPending || isClaimConfirming}
            style={{
              padding: "15px 40px",
              fontSize: "1.2rem",
              backgroundColor: isClaimPending || isClaimConfirming ? "#6c757d" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isClaimPending || isClaimConfirming ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {isClaimPending ? "Check Wallet..." : isClaimConfirming ? "Claiming..." : "Claim Referral Rewards"}
          </button>
        </div>
      )}

      {/* Investment Summary */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginBottom: "40px"
      }}>
        <div style={{
          padding: "20px",
          backgroundColor: "#e7f3ff",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Total Investment</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0 }}>
            {formatUnits(investmentData.totalInvestment, 18)} INRT
          </p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#d4edda",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Total Snowballs</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0 }}>
            {investmentData.userTotalSnowballs.toString()}
          </p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#fff3cd",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Total Rewards Paid</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0 }}>
            {formatUnits(investmentData.totalRewardGenerated, 18)} INRT
          </p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#d1ecf1",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Total Payouts</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0 }}>
            {investmentData.totalRewardClaims.toString()}
          </p>
        </div>
      </div>

      {/* Block Investments */}
      <h2>Your Investment Blocks</h2>
      {investmentData.blockSummaries.length === 0 ? (
        <div style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "10px"
        }}>
          <p style={{ fontSize: "1.2rem" }}>No investments yet. Visit the Invest page to get started!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {investmentData.blockSummaries.map((block: BlockSummary, index: number) => {
            const blockId = Number(block.blockId);
            const isRewardPaid = investmentData.rewardStatuses[index];
            const rewardTimestamp = investmentData.rewardTimestamps[index];
            const blockFilled = rewardTimestamp > 0;

            // Calculate expected reward (10% profit, so 110% total return)
            const expectedReward = (block.investedAmount * BigInt(110)) / BigInt(100);
            const profit = (block.investedAmount * BigInt(10)) / BigInt(100);

            return (
              <div key={blockId} style={{
                padding: "25px",
                border: "2px solid #ddd",
                borderRadius: "10px",
                backgroundColor: isRewardPaid ? "#e8f5e9" : blockFilled ? "#fff9e6" : "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 15px 0" }}>
                      Block #{blockId}
                    </h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <p style={{ margin: "5px 0" }}><strong>Your Snowballs:</strong> {block.purchasedSnowballs.toString()}</p>
                        <p style={{ margin: "5px 0" }}><strong>Block Size:</strong> {block.snowballCount.toString()} snowballs</p>
                        <p style={{ margin: "5px 0" }}><strong>Invested:</strong> {formatUnits(block.investedAmount, 18)} INRT</p>
                      </div>
                      <div>
                        <p style={{ margin: "5px 0" }}><strong>Expected Return:</strong> {formatUnits(expectedReward, 18)} INRT</p>
                        <p style={{ margin: "5px 0" }}><strong>Profit:</strong> {formatUnits(profit, 18)} INRT (10%)</p>
                        <p style={{ margin: "5px 0" }}><strong>Purchase Date:</strong> {new Date(Number(block.purchaseTimestamp) * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {blockFilled && (
                      <p style={{ margin: "10px 0 0 0", fontSize: "0.9rem", color: "#666" }}>
                        <strong>Block Filled On:</strong> {new Date(Number(rewardTimestamp) * 1000).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div style={{ marginLeft: "20px", textAlign: "center" }}>
                    {isRewardPaid ? (
                      <div style={{
                        padding: "15px 30px",
                        backgroundColor: "#28a745",
                        color: "white",
                        borderRadius: "8px",
                        fontWeight: "bold"
                      }}>
                        ✅ Paid
                      </div>
                    ) : blockFilled ? (
                      <div style={{
                        padding: "15px 30px",
                        backgroundColor: "#ffc107",
                        color: "black",
                        borderRadius: "8px",
                        fontWeight: "bold"
                      }}>
                        ⏳ Processing
                      </div>
                    ) : (
                      <div style={{
                        padding: "15px 30px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        borderRadius: "8px",
                        fontWeight: "bold"
                      }}>
                        🔄 Filling
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reward History */}
      {investmentData.rewardHistory.length > 0 && (
        <>
          <h2 style={{ marginTop: "60px" }}>Payment History</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "10px",
              overflow: "hidden"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#007bff", color: "white" }}>
                  <th style={{ padding: "15px", textAlign: "left" }}>Block ID</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Amount (INRT)</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Paid On</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {investmentData.rewardHistory.map((claim: RewardClaim, index: number) => (
                  <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "15px" }}>#{claim.blockId.toString()}</td>
                    <td style={{ padding: "15px", fontWeight: "bold" }}>
                      {formatUnits(claim.amount, 18)}
                    </td>
                    <td style={{ padding: "15px" }}>
                      {new Date(Number(claim.timestamp) * 1000).toLocaleString()}
                    </td>
                    <td style={{ padding: "15px" }}>
                      <span style={{
                        padding: "5px 10px",
                        backgroundColor: "#28a745",
                        color: "white",
                        borderRadius: "5px",
                        fontSize: "0.9rem"
                      }}>
                        ✅ Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{
        marginTop: "40px",
        padding: "20px",
        backgroundColor: "#e7f3ff",
        borderRadius: "10px",
        fontSize: "0.95rem"
      }}>
        <p style={{ margin: "0 0 10px 0" }}>
          ℹ️ <strong>Investment Rewards:</strong> Block rewards (110% of investment) are automatically paid when blocks fill. No manual claim needed.
        </p>
        <p style={{ margin: 0 }}>
          🎁 <strong>Referral Rewards:</strong> You must manually claim referral bonuses using the button above when available.
        </p>
      </div>

      {isClaimSuccess && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "20px",
          backgroundColor: "#28a745",
          color: "white",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          zIndex: 1000
        }}>
          <p style={{ margin: 0, fontSize: "1.2rem" }}>
            🎉 Referral rewards claimed successfully!
          </p>
        </div>
      )}
    </div>
  );
}
