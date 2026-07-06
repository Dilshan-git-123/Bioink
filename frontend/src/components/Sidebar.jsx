import "./../styles/sidebar.css";

import {
    FaHome,
    FaFlask,
    FaChartLine,
    FaDatabase,
    FaBookMedical,
    FaMicroscope,
    FaRobot,
    FaCog
} from "react-icons/fa";

function Sidebar() {

    const menuItems = [

        {
            icon: <FaHome />,
            title: "Dashboard"
        },

        {
            icon: <FaFlask />,
            title: "Designer"
        },

        {
            icon: <FaChartLine />,
            title: "Predictions"
        },

        {
            icon: <FaDatabase />,
            title: "Bioink Database"
        },

        {
            icon: <FaBookMedical />,
            title: "Literature"
        },

        {
            icon: <FaMicroscope />,
            title: "Experiments"
        },

        {
            icon: <FaRobot />,
            title: "AI Assistant"
        },

        {
            icon: <FaCog />,
            title: "Settings"
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

                        <div
                            className="menu-item"
                            key={index}
                        >

                            <span className="icon">
                                {item.icon}
                            </span>

                            <span>
                                {item.title}
                            </span>

                        </div>

                    ))
                }

            </nav>

            <div className="version">

                Version 2.0

            </div>

        </aside>

    );

}

export default Sidebar;