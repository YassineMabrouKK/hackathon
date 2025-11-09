// src/components/PredictionDashboard.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Connect to backend Socket.IO server
const socket = io("http://192.168.1.16:7002"); // replace with your backend IP

const PredictionDashboard = () => {
  const [playerData, setPlayerData] = useState(null);

  useEffect(() => {
    socket.on("predictionUpdate", (data) => {
      console.log("📡 Received prediction:", data);
      setPlayerData(data);
    });

    return () => socket.off("predictionUpdate");
  }, []);

  if (!playerData) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold">Waiting for ESP32 data...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl font-bold mb-4">🏃 Real-Time Player Prediction</h1>
      <div className="bg-gray-100 p-6 rounded-2xl shadow-lg w-80 text-center">
        <p className="text-lg">🩸 BPM: <strong>{playerData.bpm.toFixed(1)}</strong></p>
        <p className="text-lg">🌬️ SpO₂: <strong>{playerData.spo2.toFixed(1)}%</strong></p>
        <p className="text-lg">👣 Steps: <strong>{playerData.steps}</strong></p>
        <hr className="my-3" />
        <p className="text-xl font-semibold text-blue-600">
          🤖 Prediction: {playerData.prediction.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default PredictionDashboard;
