import "../styles/header.css";
import {
  FaBell,
  FaSearch,
  FaUserCircle
} from "react-icons/fa";

function Header() {
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

            <h4>GT</h4>

            <p>Researcher</p>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Header;