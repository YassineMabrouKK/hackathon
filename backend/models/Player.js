// models/Player.js
import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  playerId: { type: String, unique: true }, // generated automatically
  Age: { type: Number, default: 0 },
  Gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
  Height_cm: { type: Number, default: 0 },
  Weight_kg: { type: Number, default: 0 },
  BMI: { type: Number },
  Training_Frequency: { type: Number, default: 0 },
  Training_Duration: { type: Number, default: 0 },
  Warmup_Time: { type: Number, default: 0 },
  Sleep_Hours: { type: Number, default: 0 },
  Flexibility_Score: { type: Number, default: 0 },
  Muscle_Asymmetry: { type: Number, default: 0 },
  Recovery_Time: { type: Number, default: 0 },
  Injury_History: { type: String, default: "None" },
  Stress_Level: { type: Number, default: 0 },
  Training_Intensity: { type: Number, default: 0 },
  Injury_Risk: { type: Number, default: 0 },
  Heartrate: { type: Number, default: 0 },
  Steps: { type: Number, default: 0 },
  SpO2: { type: Number, default: 0 }
}, { timestamps: true });

// Automatically calculate BMI
playerSchema.pre("save", function(next) {
  if (this.Height_cm && this.Weight_kg) {
    this.BMI = this.Weight_kg / ((this.Height_cm / 100) ** 2);
  }
  next();
});

const Player = mongoose.model("Player", playerSchema);
export default Player;
