import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../db"; // adjust path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { walletAddress } = req.query;

  if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE walletAddress = ?",
      [walletAddress]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
}
