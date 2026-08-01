import React, { useEffect, useState } from "react";
import "../styles/header.css";
import {
  FaBell,
  FaSearch,
  FaUserCircle
} from "react-icons/fa";

function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const cachedUser = localStorage.getItem("user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
  }, []);

  return (
    <header className="header">

      <div className="search-box">

        <FaSearch className="search-icon" />

        <input
          type="text"
          placeholder="Search bioinks, materials, tissues..."
        />

      </div>

      <div className="header-right">

        <button className="notification-btn">
          <FaBell />
        </button>

        <div className="profile">

          <FaUserCircle className="profile-icon" />

          <div>

            <h4>{user ? user.name : "GT"}</h4>

            <p>Researcher</p>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Header;