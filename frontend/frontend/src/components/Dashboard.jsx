// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import "./Dashboard.css";

function Dashboard() {
  // Generate initial random values
  const initialBPM = Math.floor(60 + Math.random() * 40);
  const initialSpO2 = Math.floor(95 + Math.random() * 5);
  const initialAccel = parseFloat((Math.random() * 5).toFixed(2));
  const initialSteps = Math.floor(Math.random() * 1000);

  const [latest, setLatest] = useState({
    heartRate: initialBPM,
    spo2: initialSpO2,
    steps: initialSteps,
    accel: initialAccel
  });

  const [data, setData] = useState([
    {
      time: new Date().toLocaleTimeString(),
      heartRate: initialBPM,
      spo2: initialSpO2,
      steps: initialSteps,
      accel: initialAccel
    }
  ]);

  useEffect(() => {
    // Update chart every second with current values
    const chartInterval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const newEntry = { ...latest, time: now };
      setData(prev => [...prev.slice(-29), newEntry]); // keep last 30 entries
    }, 1000);

    // Increment steps smoothly every 15 seconds
    const stepsInterval = setInterval(() => {
      setLatest(prev => ({ ...prev, steps: prev.steps + 1 }));
    }, 15000);

    return () => {
      clearInterval(chartInterval);
      clearInterval(stepsInterval);
    };
  }, [latest]);

  return (
    <div>
      <h2 style={{ textAlign: "center", color: "#f7c948", marginTop: "20px" }}>Footballer Health Dashboard</h2>
      <div className="dashboard-container">
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
          <h3>Acceleration</h3>
          <p>{latest.accel.toFixed(2)} m/s²</p>
        </div>
      </div>

      <div className="line-chart-container">
        <LineChart width={800} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="time" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip contentStyle={{ backgroundColor: "#1e1e2f", color: "#fff" }} />
          <Legend />
          <Line type="monotone" dataKey="heartRate" stroke="#ff4d4d" name="Heart Rate (bpm)" />
          <Line type="monotone" dataKey="spo2" stroke="#4da6ff" name="SpO₂ (%)" />
          <Line type="monotone" dataKey="steps" stroke="#4dff4d" name="Steps" />
          <Line type="monotone" dataKey="accel" stroke="#ff4dff" name="Acceleration" />
        </LineChart>
      </div>
    </div>
  );
}

export default Dashboard;
