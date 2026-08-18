import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";
import {
  FaBell,
  FaSearch,
  FaUserCircle,
  FaUser,
  FaEdit,
  FaSignOutAlt,
  FaCog,
  FaChevronDown,
} from "react-icons/fa";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const loadUser = () => {
    const cached = localStorage.getItem("user");
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch { /* ignore */ }
    }
  };

  useEffect(() => {
    loadUser();
    // Re-read user whenever the Profile page saves changes
    window.addEventListener("profile-updated", loadUser);
    // Also sync when localStorage changes from another tab
    window.addEventListener("storage", loadUser);
    return () => {
      window.removeEventListener("profile-updated", loadUser);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("http://127.0.0.1:8000/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore network errors on logout */ }
    finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const displayName = user?.name || "GT";
  const displayRole = user?.role || "Researcher";
  const avatar = user?.profile_picture;

  return (
    <header className="header">
      <div className="search-box">
        <FaSearch className="search-icon" />
        <input type="text" placeholder="Search bioinks, materials, tissues..." />
      </div>

      <div className="header-right">
        <button className="notification-btn">
          <FaBell />
        </button>

        {/* Profile area — clickable */}
        <div className="profile profile--clickable" ref={dropdownRef}>
          <div
            className="profile-trigger"
            onClick={() => setDropdownOpen((o) => !o)}
            role="button"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="profile-avatar-thumb" />
            ) : (
              <FaUserCircle className="profile-icon" />
            )}

            <div className="profile-text">
              <h4>{displayName}</h4>
              <p>{displayRole}</p>
            </div>

            <FaChevronDown
              className={`profile-chevron ${dropdownOpen ? "profile-chevron--open" : ""}`}
            />
          </div>

          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="profile-dropdown-avatar" />
                ) : (
                  <FaUserCircle className="profile-dropdown-avatar-icon" />
                )}
                <div>
                  <p className="profile-dropdown-name">{displayName}</p>
                  <p className="profile-dropdown-email">{user?.email || ""}</p>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <button
                className="profile-dropdown-item"
                onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
              >
                <FaUser /> View Profile
              </button>

              <button
                className="profile-dropdown-item"
                onClick={() => { setDropdownOpen(false); navigate("/profile?edit=true"); }}
              >
                <FaEdit /> Edit Profile
              </button>

              <button
                className="profile-dropdown-item"
                onClick={() => { setDropdownOpen(false); navigate("/settings"); }}
              >
                <FaCog /> Settings
              </button>

              <div className="profile-dropdown-divider" />

              <button
                className="profile-dropdown-item profile-dropdown-item--danger"
                onClick={handleLogout}
              >
                <FaSignOutAlt /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;


