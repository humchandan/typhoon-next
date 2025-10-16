"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import contractAbi from "@/contracts/TyphoonABI.json";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const inrtTokenAddress = process.env.NEXT_PUBLIC_INRT_TOKEN_ADDRESS as `0x${string}`;

// IERC20 ABI for balance
const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

export default function WalletPage() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);

  // Get native token balance (AVAX)
  const {  nativeBalance } = useBalance({ address });

  // Get INRT token balance
  const {  inrtBalance } = useReadContract({
    address: inrtTokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Get pending referral balance
  const {  pendingReferralBalance, refetch: refetchReferral } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "getPendingReferralBalance",
    args: address ? [address] : undefined,
  });

  // Get total referral payouts
  const {  totalReferralPayouts } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "totalReferralPayouts",
    args: address ? [address] : undefined,
  });

  // Get total investments
  const {  totalInvestments } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "totalInvestments",
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
    if (address) {
      // Fetch user data
      fetch(`/api/user/getByWallet?walletAddress=${address}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setUser(data);
            // Fetch purchase history
            return fetch(`/api/purchase/history?userId=${data.id}`);
          }
        })
        .then((res) => res?.json())
        .then((purchaseData) => {
          if (purchaseData) setPurchases(purchaseData);
        });
    }
  }, [address]);

  useEffect(() => {
    if (isClaimSuccess) {
      refetchReferral();
    }
  }, [isClaimSuccess, refetchReferral]);

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
        <h1>Please connect your wallet</h1>
      </div>
    );
  }

  const hasPendingReferrals = pendingReferralBalance && pendingReferralBalance > BigInt(0);

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>💼 My Wallet</h1>

      {/* Wallet Address */}
      <div style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "10px",
        marginBottom: "30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h3 style={{ margin: "0 0 10px 0" }}>Connected Wallet</h3>
          <p style={{ 
            margin: 0, 
            fontFamily: "monospace", 
            fontSize: "1.2rem",
            fontWeight: "bold" 
          }}>
            {address}
          </p>
        </div>
        <div style={{
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "white",
          borderRadius: "8px",
          fontWeight: "bold"
        }}>
          ✓ Connected
        </div>
      </div>

      {/* Token Balances */}
      <h2>Token Balances</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
        marginBottom: "40px"
      }}>
        <div style={{
          padding: "25px",
          backgroundColor: "#e7f3ff",
          borderRadius: "10px",
          border: "2px solid #007bff"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#0056b3" }}>AVAX Balance</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
            {nativeBalance ? parseFloat(nativeBalance.formatted).toFixed(4) : "0"} AVAX
          </p>
          <p style={{ fontSize: "0.9rem", color: "#666", margin: "5px 0 0 0" }}>
            Native Token
          </p>
        </div>

        <div style={{
          padding: "25px",
          backgroundColor: "#d4edda",
          borderRadius: "10px",
          border: "2px solid #28a745"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#155724" }}>INRT Balance</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
            {inrtBalance ? parseFloat(formatUnits(inrtBalance as bigint, 18)).toFixed(2) : "0"} INRT
          </p>
          <p style={{ fontSize: "0.9rem", color: "#666", margin: "5px 0 0 0" }}>
            Investment Token
          </p>
        </div>
      </div>

      {/* Investment & Earnings Summary */}
      <h2>Investment & Earnings</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginBottom: "40px"
      }}>
        <div style={{
          padding: "20px",
          backgroundColor: "#fff3cd",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Total Invested</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#856404" }}>
            {totalInvestments ? formatUnits(totalInvestments as bigint, 18) : "0"} INRT
          </p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#d1ecf1",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Referral Earnings</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#0c5460" }}>
            {totalReferralPayouts ? formatUnits(totalReferralPayouts as bigint, 18) : "0"} INRT
          </p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#f8d7da",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Direct Referrals</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#721c24" }}>
            {user?.directCount || 0}
          </p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#d6d8db",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Team Size</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0 }}>
            {user?.teamSize || 0}
          </p>
        </div>
      </div>

      {/* Claim Referral Rewards */}
      {hasPendingReferrals && (
        <div style={{
          padding: "30px",
          backgroundColor: "#fff3cd",
          borderRadius: "10px",
          marginBottom: "40px",
          border: "2px solid #ffc107"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px"
          }}>
            <div>
              <h2 style={{ margin: "0 0 10px 0" }}>🎁 Referral Rewards Ready to Claim</h2>
              <p style={{ margin: 0, fontSize: "2rem", fontWeight: "bold", color: "#856404" }}>
                {formatUnits(pendingReferralBalance as bigint, 18)} INRT
              </p>
            </div>
            <button
              onClick={handleClaimReferralRewards}
              disabled={isClaimPending || isClaimConfirming}
              style={{
                padding: "20px 50px",
                fontSize: "1.3rem",
                backgroundColor: isClaimPending || isClaimConfirming ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: isClaimPending || isClaimConfirming ? "not-allowed" : "pointer",
                fontWeight: "bold",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
              }}
            >
              {isClaimPending ? "Check Wallet..." : isClaimConfirming ? "Claiming..." : "Claim Now"}
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <h2>Recent Transactions</h2>
      {purchases.length === 0 ? (
        <div style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "10px"
        }}>
          <p style={{ fontSize: "1.2rem" }}>No transactions yet</p>
        </div>
      ) : (
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
                <th style={{ padding: "15px", textAlign: "left" }}>Date</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Type</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Snowballs</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Block #</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "15px" }}>
                    {new Date(purchase.purchaseTimestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span style={{
                      padding: "5px 10px",
                      backgroundColor: "#007bff",
                      color: "white",
                      borderRadius: "5px",
                      fontSize: "0.9rem"
                    }}>
                      Purchase
                    </span>
                  </td>
                  <td style={{ padding: "15px", fontWeight: "bold" }}>
                    {purchase.snowballsPurchased}
                  </td>
                  <td style={{ padding: "15px" }}>
                    #{purchase.blockNumber || "N/A"}
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span style={{
                      padding: "5px 10px",
                      backgroundColor: "#28a745",
                      color: "white",
                      borderRadius: "5px",
                      fontSize: "0.9rem"
                    }}>
                      ✓ Confirmed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        marginTop: "60px",
        padding: "30px",
        backgroundColor: "#f8f9fa",
        borderRadius: "10px",
        textAlign: "center"
      }}>
        <h2>Quick Actions</h2>
        <div style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: "20px"
        }}>
          <button
            onClick={() => window.location.href = "/invest"}
            style={{
              padding: "15px 30px",
              fontSize: "1.1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            💰 Invest Now
          </button>
          <button
            onClick={() => window.location.href = "/my-investments"}
            style={{
              padding: "15px 30px",
              fontSize: "1.1rem",
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            📊 View Investments
          </button>
          <button
            onClick={() => window.location.href = "/referrals"}
            style={{
              padding: "15px 30px",
              fontSize: "1.1rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            👥 Share Referral Link
          </button>
        </div>
      </div>

      {/* Success notification */}
      {isClaimSuccess && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "25px",
          backgroundColor: "#28a745",
          color: "white",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          zIndex: 1000,
          fontSize: "1.2rem"
        }}>
          🎉 Referral rewards claimed successfully!
        </div>
      )}
    </div>
  );
}
