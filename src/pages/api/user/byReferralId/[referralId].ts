import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from '../../db'; // Adjust path as needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { referralId } = req.query;
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE referralId = ?',
      [referralId]
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json((rows as any[])[0]);
  } catch (error) {
    res.status(500).json({ error: 'DB error', details: error });
  }
}
