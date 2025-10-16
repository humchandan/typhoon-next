"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SetReferrerComponent } from "@/components/SetReferrerComponent";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const referralId = searchParams.get("referralId");

  const [sponsor, setSponsor] = useState<any>(null);
  const [formData, setFormData] = useState({
    walletAddress: "",
    username: "",
    sponsorReferralId: referralId || "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (referralId) {
      fetch(`/api/user/byReferralId/${referralId}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setSponsor(data);
        });
    }
  }, [referralId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Registration successful");
    } else {
      setMessage(data.error || "Registration failed");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Signup</h1>
      {sponsor && (
        <p>
          Your Sponsor: {sponsor.username} ({sponsor.referralId})
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <input
          name="walletAddress"
          placeholder="Wallet Address"
          value={formData.walletAddress}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", margin: "10px 0" }}
        />
        <input
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", margin: "10px 0" }}
        />
        <input
          type="hidden"
          name="sponsorReferralId"
          value={formData.sponsorReferralId}
        />

        <button type="submit" style={{ padding: "10px 20px" }}>
          Register
        </button>
      </form>

      {formData.sponsorReferralId && (
        <SetReferrerComponent sponsorReferralId={formData.sponsorReferralId} />
      )}

      {message && <p>{message}</p>}
    </div>
  );
}
