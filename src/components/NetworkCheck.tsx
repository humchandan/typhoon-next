"use client";

import { useChainValidation } from "@/hooks/useChainValidation";

export function NetworkCheck() {
  const { isWrongChain, currentChainId, expectedChainId, switchToCorrectChain, isSwitching } = useChainValidation();

  if (!isWrongChain) return null;

  return (
    <div style={{
      position: "fixed",
      top: "80px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "20px 40px",
      backgroundColor: "#dc3545",
      color: "white",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      zIndex: 1000,
      textAlign: "center",
      maxWidth: "500px"
    }}>
      <p style={{ margin: "0 0 10px 0", fontWeight: "bold", fontSize: "1.2rem" }}>
        ⚠️ Wrong Network!
      </p>
      <p style={{ margin: "0 0 15px 0", fontSize: "0.95rem" }}>
        You're on Chain ID: <strong>{currentChainId}</strong><br/>
        Please switch to Chain ID: <strong>{expectedChainId}</strong>
      </p>
      <button
        onClick={switchToCorrectChain}
        disabled={isSwitching}
        style={{
          padding: "12px 30px",
          backgroundColor: "white",
          color: "#dc3545",
          border: "none",
          borderRadius: "8px",
          cursor: isSwitching ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: "1rem"
        }}
      >
        {isSwitching ? "Switching..." : "Switch Network"}
      </button>
    </div>
  );
}
