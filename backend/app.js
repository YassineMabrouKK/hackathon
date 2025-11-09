import express from "express";
import fetch from "node-fetch"; // if using Node.js < 18
import connectDB from "./config/db.js";
import playerRoutes from "./routes/playerRoutes.js";
import Player from "./models/Player.js";
import { predict } from "./model.js";

// Connect to MongoDB
await connectDB();

const app = express();
app.use(express.json());
app.use("/api", playerRoutes);

// Pull data from ESP32 every 5s
const ESP32_IP = "http://192.168.1.50/data";

setInterval(async () => {
  try {
    const response = await fetch(ESP32_IP);
    const { playerId, bpm, spo2, steps } = await response.json();

    await Player.findOneAndUpdate(
      { playerId },
      { Heartrate: bpm, Steps: steps, Spo2: spo2, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    console.log("Player updated from ESP32");
  } catch (err) {
    console.error("Failed to fetch ESP32 data:", err.message);
  }
}, 5000);

// Prediction API endpoint
app.get("/predict/:playerId", async (req, res) => {
  try {
    const player = await Player.findOne({ playerId: req.params.playerId });
    if (!player) return res.status(404).json({ message: "Player not found" });

    // Prepare input for model
    const inputData = [
      player.Age || 0,
      player.Height_cm || 0,
      player.Weight_kg || 0,
      player.Training_Frequency || 0,
      player.Training_Duration || 0,
      player.Warmup_Time || 0,
      player.Sleep_Hours || 0,
      player.Flexibility_Score || 0,
      player.Heartrate || 0,
      player.Spo2 || 0,
      player.Steps || 0,
    ];

    const output = await predict(inputData);

    res.json({ playerId: player.playerId, prediction: output[0] }); // assuming scalar output
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error running prediction" });
  }
});

// Start server
app.listen(5000, "0.0.0.0", () => {
  console.log("✅ Server running at http://192.168.1.16:5000");
});
