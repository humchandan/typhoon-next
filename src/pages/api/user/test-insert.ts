import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../db'; // adjust path if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO users (walletAddress, username, sponsorName) VALUES (?, ?, ?)`,
      ['0xTestWallet', 'TestUser', 'SponsorTest']
    );
    res.status(200).json({ message: 'Test user inserted', result });
  } catch (error) {
    res.status(500).json({ error: 'Insertion failed', details: error });
  }
}
