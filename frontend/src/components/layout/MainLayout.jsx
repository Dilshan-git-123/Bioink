import React from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Outlet, useNavigate } from 'react-router-dom';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="workspace">
          {children || <Outlet />}
        </div>
      </div>
      <button 
        className="floating-ai-btn" 
        onClick={() => navigate('/assistant')} 
        aria-label="BioInkAI Assistant"
      >
        🤖
      </button>
    </div>
  );
};

export default MainLayout;
