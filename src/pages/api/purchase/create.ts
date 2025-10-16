import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../db"; // adjust path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const { userId, walletAddress, snowballsPurchased, totalBlockSize, blockNumber, transactionHash } = req.body;

  if (!userId || !walletAddress || !snowballsPurchased)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const [result] = await pool.execute(
      `INSERT INTO purchases (userId, walletAddress, snowballsPurchased, totalBlockSize, blockNumber, transactionHash) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, walletAddress, snowballsPurchased, totalBlockSize || 0, blockNumber || null, transactionHash || null]
    );

    res.status(201).json({ message: "Purchase recorded", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
}
