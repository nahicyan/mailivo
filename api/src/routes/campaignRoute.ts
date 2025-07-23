import express from "express";
import { Request, Response } from "express";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const campaigns: any[] = []; // Replace with DB query
    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const newCampaign = req.body;
    // Save to database
    res.status(201).json(newCampaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

export { router as campaignRoute };