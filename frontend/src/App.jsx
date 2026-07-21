import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Initialize from "./pages/Initialize/Initialize";
import Welcome from "./pages/Welcome/Welcome";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import MainLayout from "./components/layout/MainLayout";
import Designer from "./pages/Designer/Designer";
import Dashboard from "./pages/Dashboard/Dashboard";
import Predictions from "./pages/Predictions/Predictions";
import Database from "./pages/Database/Database";
import Literature from "./pages/Literature/Literature";
import Experiments from "./pages/Experiments/Experiments";
import Assistant from "./pages/Assistant/Assistant";
import Settings from "./pages/Settings/Settings";
import "./styles/layout.css";

function App() {
  return (
    <>
      {/* Main application router */}
      <Router>
        <Routes>
          {/* Public Routes - standalone, no sidebar/header */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/initialize" element={<Initialize />} />
          <Route path="/welcome" element={<Welcome />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes - wrapped in MainLayout with Sidebar + Header */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/designer" element={<Designer />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/database" element={<Database />} />
            <Route path="/literature" element={<Literature />} />
            <Route path="/experiments" element={<Experiments />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch-all: redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;