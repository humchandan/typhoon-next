import type { NextApiRequest, NextApiResponse } from "next";
import { eventListener } from "../../services/eventListener";

// This will be called once when the API routes are initialized
eventListener.startListening();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: "Event listener initialized" });
}
