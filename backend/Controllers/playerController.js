// controllers/playerController.js
import Player from "../models/Player.js";
import { v4 as uuidv4 } from "uuid"; // npm install uuid

export const createOrUpdatePlayer = async (req, res) => {
  try {
    const {
      playerId,
      bpm, // ESP32 data
      spo2,
      steps,
      // Frontend data
      Age, Gender, Height_cm, Weight_kg,
      Training_Frequency, Training_Duration, Warmup_Time, Sleep_Hours,
      Flexibility_Score, Muscle_Asymmetry, Recovery_Time,
      Injury_History, Stress_Level, Training_Intensity
    } = req.body;

    let player;

    if (playerId) {
      // Try to find existing player by playerId
      player = await Player.findOne({ playerId });

      if (player) {
        // Update ESP32 data
        player.Heartrate = bpm !== undefined ? bpm : player.Heartrate;
        player.Steps = steps !== undefined ? steps : player.Steps;
        player.SpO2 = spo2 !== undefined ? spo2 : player.SpO2;

        // Update frontend fields if provided
        Object.assign(player, {
          Age, Gender, Height_cm, Weight_kg,
          Training_Frequency, Training_Duration, Warmup_Time, Sleep_Hours,
          Flexibility_Score, Muscle_Asymmetry, Recovery_Time,
          Injury_History, Stress_Level, Training_Intensity
        });

        player.updatedAt = new Date();
        await player.save();

        return res.status(200).json({ message: "Player data updated", data: player });
      }
    }

    // If no playerId or not found → create new player
    const newPlayerId = playerId || uuidv4();
    player = await Player.create({
      playerId: newPlayerId,
      Heartrate: bpm || 0,
      Steps: steps || 0,
      SpO2: spo2 || 0,
      Age, Gender, Height_cm, Weight_kg,
      Training_Frequency, Training_Duration, Warmup_Time, Sleep_Hours,
      Flexibility_Score, Muscle_Asymmetry, Recovery_Time,
      Injury_History, Stress_Level, Training_Intensity
    });

    return res.status(201).json({ message: "Player created", data: player });
  } catch (error) {
    console.error("❌ Error storing player:", error);
    res.status(500).json({ error: "Server error" });
  }
};
