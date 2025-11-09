// src/components/PlayerForm.jsx
import { useState, useEffect } from "react";
import "./PlayerForm.css";

export default function PlayerForm() {
  const [player, setPlayer] = useState({
    playerId: "player1",
    Age: "",
    Gender: "Other",
    Height_cm: "",
    Weight_kg: "",
    Training_Frequency: "",
    Training_Duration: "",
    Warmup_Time: "",
    Sleep_Hours: "",
    Flexibility_Score: "",
    Muscle_Asymmetry: "",
    Recovery_Time: "",
    Injury_History: "",
    Stress_Level: "",
    Training_Intensity: ""
  });

  const [message, setMessage] = useState("");

  // Fetch latest player data on component mount
  useEffect(() => {
    fetch("http://192.168.1.16:5000/api/player")
      .then(res => res.json())
      .then(data => setPlayer(prev => ({ ...prev, ...data })))
      .catch(err => console.error("Failed to fetch player:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlayer(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert numeric fields to numbers
    const numericFields = [
      "Age","Height_cm","Weight_kg","Training_Frequency",
      "Training_Duration","Warmup_Time","Sleep_Hours",
      "Flexibility_Score","Muscle_Asymmetry","Recovery_Time",
      "Stress_Level","Training_Intensity"
    ];

    const payload = { ...player };
    numericFields.forEach(field => {
      if(payload[field] !== "") payload[field] = Number(payload[field]);
    });

    try {
      const res = await fetch("http://192.168.1.16:5000/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      setMessage(result.message);
    } catch (err) {
      console.error(err);
      setMessage("Failed to send player data.");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto" }}>
      <h2>Add / Update Player</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="playerId"
          value={player.playerId}
          readOnly
          style={{ display: "none" }}
        />
        <input name="Age" value={player.Age} onChange={handleChange} placeholder="Age" /><br/>
        <select name="Gender" value={player.Gender} onChange={handleChange}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select><br/>
        <input name="Height_cm" value={player.Height_cm} onChange={handleChange} placeholder="Height (cm)" /><br/>
        <input name="Weight_kg" value={player.Weight_kg} onChange={handleChange} placeholder="Weight (kg)" /><br/>
        <input name="Training_Frequency" value={player.Training_Frequency} onChange={handleChange} placeholder="Training Frequency" /><br/>
        <input name="Training_Duration" value={player.Training_Duration} onChange={handleChange} placeholder="Training Duration" /><br/>
        <input name="Warmup_Time" value={player.Warmup_Time} onChange={handleChange} placeholder="Warmup Time" /><br/>
        <input name="Sleep_Hours" value={player.Sleep_Hours} onChange={handleChange} placeholder="Sleep Hours" /><br/>
        <input name="Flexibility_Score" value={player.Flexibility_Score} onChange={handleChange} placeholder="Flexibility Score" /><br/>
        <input name="Muscle_Asymmetry" value={player.Muscle_Asymmetry} onChange={handleChange} placeholder="Muscle Asymmetry" /><br/>
        <input name="Recovery_Time" value={player.Recovery_Time} onChange={handleChange} placeholder="Recovery Time" /><br/>
        <input name="Injury_History" value={player.Injury_History} onChange={handleChange} placeholder="Injury History" /><br/>
        <input name="Stress_Level" value={player.Stress_Level} onChange={handleChange} placeholder="Stress Level" /><br/>
        <input name="Training_Intensity" value={player.Training_Intensity} onChange={handleChange} placeholder="Training Intensity" /><br/>
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
