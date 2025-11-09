import express from "express";
import Player from "../models/Player.js";
import { createOrUpdatePlayer } from "../controllers/playerController.js";

const router = express.Router();

// POST ESP32 data → create or update single player
router.post("/player", createOrUpdatePlayer);

// GET all players → view stored data
// Optional: since you only have one player, you could return just the latest
router.get("/player", async (req, res) => {
  try {
    const player = await Player.findOne().sort({ updatedAt: -1 }); // get latest player
    if (!player) {
      return res.status(404).json({ error: "No player found" });
    }
    res.json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch player" });
  }
});

export default router;
