import express from "express";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import Player from "./models/Player.js";
import * as ort from "onnxruntime-node";

// ===== Connect to MongoDB =====
await connectDB();

// ===== Initialize Express & Socket.IO =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(express.json());

// ===== Socket.IO logging =====
io.on("connection", (socket) => {
  console.log("🟢 Frontend connected:", socket.id);
  socket.on("disconnect", () => console.log("🔴 Frontend disconnected:", socket.id));
});

// ===== Load ONNX model =====
let session;
async function loadModel() {
  try {
    session = await ort.InferenceSession.create(
      "C:/Users/MSI/Desktop/hackaa/hackathon/backend/injury_risk_rf_reg (1).onnx"
    );
    console.log("✅ ONNX model loaded successfully");
    console.log("Model input names:", session.inputNames);
    console.log("Model output names:", session.outputNames);
  } catch (err) {
    console.error("❌ Failed to load ONNX model:", err.message);
  }
}
await loadModel();

// ===== Prediction function =====
async function predict(inputData) {
  if (!session) throw new Error("Model session is not initialized");

  // Convert input data to tensor
  const tensor = new ort.Tensor("float32", Float32Array.from(inputData), [1, inputData.length]);

  // Use the actual model input name
  const feeds = {};
  feeds[session.inputNames[0]] = tensor;

  const results = await session.run(feeds);

  // Get prediction dynamically
  const outputName = Object.keys(results)[0];
  return results[outputName].data;
}

// ===== Fetch all players and predict =====
async function fetchAndPredict() {
  try {
    const players = await Player.find();

    for (const player of players) {
      const bpm = player.Heartrate ?? 0;
      const spo2 = player.SpO2 ?? 0;
      const steps = player.Steps ?? 0;

      // Make sure we use all 17 features from the player document
      const inputData = [
        player.Age ?? 0,
        player.Gender === "Male" ? 1 : player.Gender === "Female" ? 2 : 0, // encode gender
        player.Height_cm ?? 0,
        player.Weight_kg ?? 0,
        player.Training_Frequency ?? 0,
        player.Training_Duration ?? 0,
        player.Warmup_Time ?? 0,
        player.Sleep_Hours ?? 0,
        player.Flexibility_Score ?? 0,
        player.Muscle_Asymmetry ?? 0,
        player.Recovery_Time ?? 0,
        player.Injury_History === "None" ? 0 : 1, // encode injury history
        player.Stress_Level ?? 0,
        player.Training_Intensity ?? 0,
        bpm,
        spo2,
        steps,
      ];

      let prediction = null;
      try {
        prediction = await predict(inputData);
      } catch (err) {
        console.error("❌ Error running prediction:", err.message);
      }

      io.emit("predictionUpdate", {
        playerId: player.playerId ?? "unknown",
        bpm,
        spo2,
        steps,
        prediction: prediction?.[0] ?? null,
      });

      console.log(
        `📡 Player ${player.playerId ?? "unknown"} -> BPM: ${bpm}, SpO2: ${spo2}, Steps: ${steps}, Prediction: ${prediction?.[0] ?? null}`
      );
    }
  } catch (err) {
    console.error("❌ Error fetching players:", err.message);
  }
}

// ===== Poll MongoDB every 2 seconds =====
setInterval(fetchAndPredict, 2000);

// ===== POST endpoint to receive ESP32 data =====
app.post("/api/players", async (req, res) => {
  try {
    const { bpm, spo2, steps, playerId = 1 } = req.body;

    if (bpm == null || spo2 == null || steps == null) {
      return res.status(400).json({ message: "Incomplete data" });
    }

    const player = await Player.findOneAndUpdate(
      { playerId },
      {
        Heartrate: bpm,
        SpO2: spo2,
        Steps: steps,
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Player data stored", player });
  } catch (err) {
    console.error("❌ Error storing player:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== Start server =====
const PORT = 7002;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
