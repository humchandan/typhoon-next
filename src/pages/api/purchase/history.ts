import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM purchases WHERE userId = ? ORDER BY purchaseTimestamp DESC`,
      [userId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    res.status(500).json({ error: "Database error" });
  }
}
