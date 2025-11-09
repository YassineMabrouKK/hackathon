// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { io } from "socket.io-client";
import "./Dashboard.css";

// Connect to backend Socket.IO server
const socket = io("http://192.168.1.13:7002"); // Replace with your backend IP

function Dashboard() {
  // State for latest values per player
  const [latest, setLatest] = useState({
    heartRate: 0,
    spo2: 0,
    steps: 0,
    accel: 0,
    prediction: 0,
    playerId: "unknown",
  });

  // Chart data
  const [data, setData] = useState([]);

  useEffect(() => {
    // Listen to predictionUpdate events from backend
    socket.on("predictionUpdate", (playerData) => {
      setLatest({
        heartRate: playerData.bpm,
        spo2: playerData.spo2,
        steps: playerData.steps,
        accel: playerData.accel ?? 0, // optional
        prediction: playerData.prediction ?? 0,
        playerId: playerData.playerId ?? "unknown",
      });

      const now = new Date().toLocaleTimeString();
      const newEntry = {
        time: now,
        heartRate: playerData.bpm,
        spo2: playerData.spo2,
        steps: playerData.steps,
        accel: playerData.accel ?? 0,
        prediction: playerData.prediction ?? 0,
      };

      setData((prev) => [...prev.slice(-29), newEntry]); // keep last 30 entries
    });

    return () => {
      socket.off("predictionUpdate");
    };
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: "center", color: "#f7c948", marginTop: "20px" }}>
        Footballer Health Dashboard
      </h2>

      <div className="dashboard-container">
        <div className="card">
          <h3>Player ID</h3>
          <p>{latest.playerId}</p>
        </div>
        <div className="card">
          <h3>Heart Rate</h3>
          <p>{latest.heartRate} bpm</p>
        </div>
        <div className="card">
          <h3>SpO₂</h3>
          <p>{latest.spo2} %</p>
        </div>
        <div className="card">
          <h3>Steps</h3>
          <p>{latest.steps}</p>
        </div>
        <div className="card">
          <h3>Injury Risk Prediction</h3>
          <p>{latest.prediction?.toFixed(2)}</p>
        </div>
      </div>

      <div className="line-chart-container">
        <LineChart width={900} height={350} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="time" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip contentStyle={{ backgroundColor: "#1e1e2f", color: "#fff" }} />
          <Legend />
          <Line type="monotone" dataKey="heartRate" stroke="#ff4d4d" name="Heart Rate (bpm)" />
          <Line type="monotone" dataKey="spo2" stroke="#4da6ff" name="SpO₂ (%)" />
          <Line type="monotone" dataKey="steps" stroke="#4dff4d" name="Steps" />
          <Line type="monotone" dataKey="prediction" stroke="#ffb84d" name="Injury Risk (%)" />
        </LineChart>
      </div>
    </div>
  );
}

export default Dashboard;
