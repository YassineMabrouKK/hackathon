// src/components/Sidebar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaHome, FaUserPlus } from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <ul>
          <li>
            <Link to="/" onClick={toggleSidebar}>
              <FaHome /> <span className="label">Home</span>
            </Link>
          </li>
          <li>
            <Link to="/add-player" onClick={toggleSidebar}>
              <FaUserPlus /> <span className="label">Add Player</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Hamburger button */}
      <button className="hamburger" onClick={toggleSidebar}>
        <FaBars />
      </button>
    </>
  );
}
