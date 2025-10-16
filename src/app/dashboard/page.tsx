"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const {  balance } = useBalance({ address });

  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        })
        .finally(() => setLoading(false));
    }
  }, [address]);

  if (!isConnected) return <div>Please connect your wallet</div>;
  if (loading) return <div>Loading dashboard...</div>;
  if (!user) return <div>User not found. Please register first.</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Dashboard</h1>

      {/* User Profile Section */}
      <section>
        <h2>Profile</h2>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Wallet:</strong> {address}</p>
        <p><strong>Referral ID:</strong> {user.referralId}</p>
        <p>
          <strong>Referral Link:</strong>{" "}
          <a href={`/signup?referralId=${user.referralId}`} target="_blank">
            {typeof window !== 'undefined' && `${window.location.origin}/signup?referralId=${user.referralId}`}
          </a>
        </p>
      </section>

      {/* Income & Balance Section */}
      <section>
        <h2>Financial Summary</h2>
        <p><strong>My Balance:</strong> {balance?.formatted} {balance?.symbol}</p>
      </section>

      {/* Purchase Report Card */}
      <section>
        <h2>Purchase Report Card</h2>
        {purchases.length === 0 ? (
          <p>No purchases yet</p>
        ) : (
          <table border={1} cellPadding={10}>
            <thead>
              <tr>
                <th>#</th>
                <th>Snowballs Purchased</th>
                <th>Total Block Size</th>
                <th>Block Number</th>
                <th>Purchase Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase, index) => (
                <tr key={purchase.id}>
                  <td>{index + 1}</td>
                  <td>{purchase.snowballsPurchased}</td>
                  <td>{purchase.totalBlockSize}</td>
                  <td>{purchase.blockNumber || "N/A"}</td>
                  <td>{new Date(purchase.purchaseTimestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
