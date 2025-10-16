import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../db'; // adjust path if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users LIMIT 5');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed', details: error });
  }
}
