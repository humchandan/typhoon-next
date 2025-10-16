import type { NextApiRequest, NextApiResponse } from "next";
import { eventListener } from "../../../services/eventListener";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await eventListener.startListening();
    res.status(200).json({ message: "Event listener started" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start event listener" });
  }
}
