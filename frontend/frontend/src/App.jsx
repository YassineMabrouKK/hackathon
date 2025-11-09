// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import AddPlayerPage from "./pages/AddPlayerPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add-player" element={<AddPlayerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
