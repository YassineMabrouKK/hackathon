import express from "express";
import connectDB from "./config/db.js";
import playerRoutes from "./routes/playerRoutes.js";
import Player from "./models/Player.js";
import { predict } from "./model.js";

// ✅ Connect to MongoDB
await connectDB();

const app = express();
app.use(express.json());
app.use("/api", playerRoutes); // keep this if you have extra routes

// ✅ ESP32 sends POST requests to this endpoint
app.post("/api/players", async (req, res) => {
  try {
    const { bpm, spo2, steps } = req.body;

    // Optional: log incoming data
    console.log("📡 Received data from ESP32:", req.body);

    // Save or update player data (for example, assume a fixed playerId = 1)
    const playerId = 1;

    await Player.findOneAndUpdate(
      { playerId },
      {
        Heartrate: bpm,
        Spo2: spo2,
        Steps: steps,
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "✅ Player data stored successfully" });
  } catch (err) {
    console.error("❌ Error saving player data:", err.message);
    res.status(500).json({ message: "Error saving player data" });
  }
});

// ✅ Prediction API endpoint
app.get("/predict/:playerId", async (req, res) => {
  try {
    const player = await Player.findOne({ playerId: req.params.playerId });
    if (!player) return res.status(404).json({ message: "Player not found" });

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
    res.json({ playerId: player.playerId, prediction: output[0] });
  } catch (err) {
    console.error("❌ Error running prediction:", err);
    res.status(500).json({ message: "Error running prediction" });
  }
});

// ✅ Start server on port 7002
const PORT = 7002;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://192.168.1.16:${PORT}`);
});
