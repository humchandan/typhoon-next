
import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../db"  ; // adjust path

function generateReferralId(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const { walletAddress, username, sponsorReferralId } = req.body;

  if (!walletAddress || !username)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    // Check if wallet or username already exists
    const [existing] = await pool.execute(
      "SELECT * FROM users WHERE walletAddress = ? OR username = ?",
      [walletAddress, username]
    );

    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: "Wallet or username already registered" });
    }

    // Generate unique referralId for this new user
    let referralId = generateReferralId();
    // Could add check for unique referralId here, skipped for brevity

    // Insert new user record
    await pool.execute(
      `INSERT INTO users (walletAddress, username, sponsorReferralId, referralId) VALUES (?, ?, ?, ?)`,
      [walletAddress, username, sponsorReferralId || null, referralId]
    );

    res.status(201).json({ message: "User registered successfully", referralId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
}
