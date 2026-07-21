import React from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { Outlet } from 'react-router-dom';

const MainLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="workspace">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
