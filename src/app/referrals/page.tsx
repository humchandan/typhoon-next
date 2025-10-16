"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import contractAbi from "@/contracts/TyphoonABI.json";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function ReferralsPage() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<any>(null);
  const [referralTree, setReferralTree] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Fetch pending referral balance from contract
  const {  pendingReferralBalance } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "getPendingReferralBalance",
    args: address ? [address] : undefined,
  });

  // Fetch total referral payouts from contract
  const {  totalReferralPayouts } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "totalReferralPayouts",
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    if (address) {
      // Fetch user data
      fetch(`/api/user/getByWallet?walletAddress=${address}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setUser(data);
            // Fetch referral tree
            return fetch(`/api/user/referralTree?userId=${data.id}`);
          }
        })
        .then((res) => res?.json())
        .then((treeData) => {
          if (treeData) setReferralTree(treeData);
        });
    }
  }, [address]);

  const handleCopyReferralLink = () => {
    if (user) {
      const referralLink = `${window.location.origin}/signup?referralId=${user.referralId}`;
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Please connect your wallet to view referrals</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Loading referral data...</h1>
      </div>
    );
  }

  // Referral bonus percentages by level
  const levelBonuses = [
    { level: 1, percentage: 2.0 },
    { level: 2, percentage: 1.0 },
    { level: 3, percentage: 1.0 },
    { level: 4, percentage: 1.0 },
    { level: 5, percentage: 1.0 },
    { level: 6, percentage: 1.0 },
    { level: 7, percentage: 0.5 },
    { level: 8, percentage: 0.5 },
    { level: 9, percentage: 0.5 },
    { level: 10, percentage: 0.5 },
    { level: 11, percentage: 0.5 },
    { level: 12, percentage: 0.25 },
    { level: 13, percentage: 0.25 },
    { level: 14, percentage: 0.25 },
    { level: 15, percentage: 0.25 },
  ];

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>👥 Referral Program</h1>

      {/* Referral Link Section */}
      <div style={{
        padding: "30px",
        backgroundColor: "#007bff",
        color: "white",
        borderRadius: "10px",
        marginBottom: "40px"
      }}>
        <h2 style={{ margin: "0 0 15px 0" }}>Your Referral Link</h2>
        <div style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          backgroundColor: "white",
          padding: "15px",
          borderRadius: "8px"
        }}>
          <input
            type="text"
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup?referralId=${user.referralId}`}
            readOnly
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              fontSize: "1rem",
              color: "#333"
            }}
          />
          <button
            onClick={handleCopyReferralLink}
            style={{
              padding: "10px 30px",
              backgroundColor: copied ? "#28a745" : "#ffc107",
              color: copied ? "white" : "black",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem"
            }}
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>
        <p style={{ margin: "15px 0 0 0", fontSize: "0.95rem" }}>
          Share this link with others to earn referral bonuses from their investments!
        </p>
      </div>

      {/* Referral Earnings Summary */}
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
          <h3>Pending Rewards</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#856404" }}>
            {pendingReferralBalance ? formatUnits(pendingReferralBalance as bigint, 18) : "0"} INRT
          </p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#d4edda",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Total Earned</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#155724" }}>
            {totalReferralPayouts ? formatUnits(totalReferralPayouts as bigint, 18) : "0"} INRT
          </p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#d1ecf1",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Direct Referrals</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#0c5460" }}>
            {user.directCount || 0}
          </p>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "#f8d7da",
          borderRadius: "10px",
          textAlign: "center"
        }}>
          <h3>Team Size</h3>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#721c24" }}>
            {user.teamSize || 0}
          </p>
        </div>
      </div>

      {/* Referral Commission Structure */}
      <h2>Commission Structure (15 Levels)</h2>
      <div style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "10px",
        marginBottom: "40px"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "15px"
        }}>
          {levelBonuses.map((level) => (
            <div key={level.level} style={{
              padding: "15px",
              backgroundColor: level.level === 1 ? "#007bff" : level.level <= 6 ? "#17a2b8" : level.level <= 11 ? "#ffc107" : "#6c757d",
              color: level.level <= 11 ? "white" : "white",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{level.percentage}%</div>
              <div style={{ fontSize: "0.9rem" }}>Level {level.level}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Referrals List */}
      <h2>Your Direct Referrals ({referralTree?.directReferrals?.length || 0})</h2>
      {referralTree?.directReferrals?.length === 0 ? (
        <div style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "10px"
        }}>
          <p style={{ fontSize: "1.2rem" }}>No direct referrals yet. Share your link to get started!</p>
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
                <th style={{ padding: "15px", textAlign: "left" }}>#</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Username</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Wallet</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Total Purchase</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Their Team</th>
                <th style={{ padding: "15px", textAlign: "left" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {referralTree?.directReferrals?.map((referral: any, index: number) => (
                <tr key={referral.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "15px" }}>{index + 1}</td>
                  <td style={{ padding: "15px", fontWeight: "bold" }}>{referral.username}</td>
                  <td style={{ padding: "15px", fontFamily: "monospace", fontSize: "0.9rem" }}>
                    {referral.walletAddress.slice(0, 6)}...{referral.walletAddress.slice(-4)}
                  </td>
                  <td style={{ padding: "15px" }}>${referral.totalPurchase || 0}</td>
                  <td style={{ padding: "15px" }}>{referral.teamSize || 0}</td>
                  <td style={{ padding: "15px" }}>
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Note */}
      <div style={{
        marginTop: "40px",
        padding: "20px",
        backgroundColor: "#e7f3ff",
        borderRadius: "10px"
      }}>
        <h3>How It Works</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>You earn <strong>2%</strong> commission on Level 1 (direct referrals) investments</li>
          <li>You earn <strong>1%</strong> on Levels 2-6 investments</li>
          <li>You earn <strong>0.5%</strong> on Levels 7-11 investments</li>
          <li>You earn <strong>0.25%</strong> on Levels 12-15 investments</li>
          <li>Referral bonuses accumulate and can be claimed on the My Investments page</li>
          <li>Build your team to maximize passive income from 15 levels deep!</li>
        </ul>
      </div>
    </div>
  );
}
