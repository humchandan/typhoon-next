"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        backgroundColor: "#1a1a1a",
        color: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "bold", textDecoration: "none", color: "white" }}>
            🌪️ Typhoon
          </Link>
        </div>
        <div>Loading...</div>
      </nav>
    );
  }

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 40px",
      backgroundColor: "#1a1a1a",
      color: "white",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "bold", textDecoration: "none", color: "white" }}>
          🌪️ Typhoon
        </Link>
        
        {isConnected && (
          <>
            <Link href="/dashboard" style={{ textDecoration: "none", color: "white" }}>
              Dashboard
            </Link>
            <Link href="/invest" style={{ textDecoration: "none", color: "white" }}>
              Invest
            </Link>
            <Link href="/my-investments" style={{ textDecoration: "none", color: "white" }}>
              My Investments
            </Link>
            <Link href="/referrals" style={{ textDecoration: "none", color: "white" }}>
              Referrals
            </Link>
            <Link href="/wallet" style={{ textDecoration: "none", color: "white" }}>
              Wallet
            </Link>
          </>
        )}
      </div>

      <div>
        {!isConnected ? (
          <div style={{ display: "flex", gap: "10px" }}>
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                Connect {connector.name}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <span style={{ 
              padding: "8px 15px", 
              backgroundColor: "#333", 
              borderRadius: "8px",
              fontSize: "0.9rem"
            }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              onClick={() => disconnect()}
              style={{
                padding: "10px 20px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
