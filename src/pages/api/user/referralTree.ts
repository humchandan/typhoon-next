import { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    // Get user's referral ID first
    const [userRows] = await pool.execute(
      "SELECT referralId FROM users WHERE id = ?",
      [userId]
    );

    if ((userRows as any[]).length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userReferralId = (userRows as any[])[0].referralId;

    // Get all direct referrals (removed createdAt for now)
    const [directReferrals] = await pool.execute(
      `SELECT id, username, walletAddress, referralId, totalPurchase, directCount, teamSize 
       FROM users WHERE sponsorReferralId = ?`,
      [userReferralId]
    );

    return res.status(200).json({
      directReferrals,
    });
  } catch (error) {
    console.error("Error fetching referral tree:", error);
    return res.status(500).json({ error: "Database error" });
  }
}
