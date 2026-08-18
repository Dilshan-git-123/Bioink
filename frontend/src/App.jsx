import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider } from "./context/ProjectContext";
import Initialize from "./pages/Initialize/Initialize";
import Welcome from "./pages/Welcome/Welcome";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import MainLayout from "./components/layout/MainLayout";
import Designer from "./pages/Designer/Designer";
import Dashboard from "./pages/Dashboard/Dashboard";
import Predictions from "./pages/Predictions/Predictions";
import Database from "./pages/Database/Database";
import Literature from "./pages/Literature/Literature";
import Experiments from "./pages/Experiments/Experiments";
import Assistant from "./pages/Assistant/Assistant";
import Settings from "./pages/Settings/Settings";
import KnowledgeBase from "./pages/KnowledgeBase/KnowledgeBase";
import Projects from "./pages/Projects/Projects.jsx";
import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { getCurrentUser, isAuthenticated } from "./services/authService";
import "./styles/layout.css";


function App() {
  const [appInitializing, setAppInitializing] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (isAuthenticated()) {
        try {
          await getCurrentUser();
        } catch (err) {
          console.error("Session verification failed:", err);
        }
      }
      setAppInitializing(false);
    };
    verifySession();
  }, []);

  if (appInitializing) {
    return (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#38bdf8', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '16px', fontWeight: 'bold' }}>🧬 BioInkAI</h2>
          <div className="session-loader" style={{ border: '4px solid rgba(56, 189, 248, 0.1)', borderTop: '4px solid #38bdf8', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: '#94a3b8' }}>Loading application session...</p>
        </div>
      </div>
    );
  }

  return (
    <ProjectProvider>
      {/* Main application router */}
      <Router>
        <Routes>
          {/* Public Routes - standalone, no sidebar/header */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/initialize" element={<Initialize />} />
          <Route path="/welcome" element={<Welcome />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes - wrapped in ProtectedRoute and MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/designer" element={<Designer />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/database" element={<Database />} />
              <Route path="/literature" element={<Literature />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Catch-all: redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;
