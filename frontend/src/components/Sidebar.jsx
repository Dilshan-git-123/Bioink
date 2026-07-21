import "./../styles/sidebar.css";

import { NavLink, useNavigate } from "react-router-dom";
import {
    FaHome,
    FaFlask,
    FaChartLine,
    FaDatabase,
    FaBookMedical,
    FaMicroscope,
    FaRobot,
    FaCog,
    FaSignOutAlt
} from "react-icons/fa";

function Sidebar() {

    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');
    };

    const menuItems = [

        {
            icon: <FaHome />,
            title: "Dashboard",
            path: "/dashboard"
        },

        {
            icon: <FaFlask />,
            title: "Designer",
            path: "/designer"
        },

        {
            icon: <FaChartLine />,
            title: "Predictions",
            path: "/predictions"
        },

        {
            icon: <FaDatabase />,
            title: "Bioink Database",
            path: "/database"
        },

        {
            icon: <FaBookMedical />,
            title: "Literature",
            path: "/literature"
        },

        {
            icon: <FaMicroscope />,
            title: "Experiments",
            path: "/experiments"
        },

        {
            icon: <FaRobot />,
            title: "AI Assistant",
            path: "/assistant"
        },

        {
            icon: <FaCog />,
            title: "Settings",
            path: "/settings"
        }

    ];

    return (

        <aside className="sidebar">

            <div className="logo">

                <h1>🧬 BioInkAI</h1>

                <p>
                    AI Powered Bioink Design
                </p>

            </div>

            <nav>

                {
                    menuItems.map((item, index) => (

                        <NavLink
                            to={item.path}
                            className={({ isActive }) => isActive ? "menu-item active" : "menu-item"}
                            key={index}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >

                            <span className="icon">
                                {item.icon}
                            </span>

                            <span>
                                {item.title}
                            </span>

                        </NavLink>

                    ))
                }

            </nav>

            <div className="sidebar-bottom">

                <button className="logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt className="logout-icon" />
                    <span>Logout</span>
                </button>

                <div className="version">

                    Version 2.0

                </div>

            </div>

        </aside>

    );

}

export default Sidebar;