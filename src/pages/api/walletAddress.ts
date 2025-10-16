import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../db'; // adjust path as needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { walletAddress } = req.query;

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE walletAddress = ?',
        [walletAddress]
      );
      if ((rows as any[]).length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json((rows as any[])[0]);
    } catch (error) {
      res.status(500).json({ error: 'Database error', details: error });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
