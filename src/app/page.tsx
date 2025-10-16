"use client";

import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) {
      // Check if user is registered
      fetch(`/api/user/getByWallet?walletAddress=${address}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            // User exists, redirect to dashboard
            router.push("/dashboard");
          }
        });
    }
  }, [isConnected, address, router]);

  return (
    <div style={{ 
      padding: "60px 20px", 
      maxWidth: "1200px", 
      margin: "0 auto",
      textAlign: "center" 
    }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>
        🌪️ Welcome to Typhoon
      </h1>
      <p style={{ fontSize: "1.5rem", marginBottom: "40px", color: "#666" }}>
        Decentralized Investment Platform with Multi-Level Referral Rewards
      </p>

      {!isConnected ? (
        <div>
          <p style={{ fontSize: "1.2rem", marginBottom: "30px" }}>
            Connect your wallet to get started
          </p>
          <div style={{ 
            padding: "20px", 
            backgroundColor: "#f0f0f0", 
            borderRadius: "10px",
            display: "inline-block"
          }}>
            <p>Use the wallet button in the top right to connect</p>
          </div>
        </div>
      ) : (
        <div>
          <h2>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</h2>
          <div style={{ marginTop: "40px" }}>
            <button
              onClick={() => router.push("/signup")}
              style={{
                padding: "15px 40px",
                fontSize: "1.2rem",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginRight: "20px"
              }}
            >
              Register / Signup
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "15px 40px",
                fontSize: "1.2rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: "80px", textAlign: "left" }}>
        <h2>Features:</h2>
        <ul style={{ fontSize: "1.1rem", lineHeight: "2" }}>
          <li>💰 Purchase snowballs and earn rewards</li>
          <li>🎁 Claim rewards when blocks fill up (105% returns)</li>
          <li>👥 15-level referral system with bonuses up to 2%</li>
          <li>📊 Real-time dashboard tracking</li>
          <li>🔒 Secure smart contract on Avalanche Fuji</li>
        </ul>
      </div>
    </div>
  );
}
