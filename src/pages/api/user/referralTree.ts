import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    // Get all users who have this user as sponsor (direct referrals)
    const [directReferrals] = await pool.execute(
      `SELECT id, username, walletAddress, referralId, totalPurchase, directCount, teamSize, createdAt 
       FROM users WHERE sponsorReferralId = (SELECT referralId FROM users WHERE id = ?)`,
      [userId]
    );

    // Get total referral count at each level (you can expand this logic)
    const [levelCounts] = await pool.execute(
      `SELECT COUNT(*) as count FROM users WHERE sponsorReferralId = (SELECT referralId FROM users WHERE id = ?)`,
      [userId]
    );

    res.status(200).json({
      directReferrals,
      levelCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
}
