import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaMicrosoft, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './Login.css';

// Asset imports - using only existing assets
import loginHero from '../../assets/images/login-hero.png';

const Login = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/initialize');
  };

  return (
    <motion.div
      className={`login-page ${isLoaded ? 'loaded' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="login-bg-mesh" />
      <div className="particles-container">
        <div className="floating-particle p-1" />
        <div className="floating-particle p-2" />
        <div className="floating-particle p-3" />
        <div className="floating-particle p-4" />
        <div className="floating-particle p-5" />
      </div>

      <div className="login-container">
        {/* Left Hero Section (60%) */}
        <section className="login-left">
          <div className="left-content">
            <div className="brand-header">
              <h1 className="brand-title">
                <span className="dna-icon">🧬</span> BioInkAI
              </h1>
              <span className="brand-badge">SaaS Enterprise</span>
            </div>

            <div className="hero-text-block">
              <h2 className="hero-subtitle">Next-Gen Bio-Fabrication</h2>
              <h3 className="hero-title">AI-Powered Bioink Design</h3>
            </div>

            <div className="scientific-illustration-container">
              <img
                src={loginHero}
                alt="AI Bioink Design Illustration"
                className="premium-illustration"
              />
            </div>

            <div className="quote-block">
              <p className="quote-text">
                "Engineering the Future of Living Tissues through Artificial Intelligence."
              </p>
            </div>
          </div>
        </section>

        {/* Right Login Section (40%) */}
        <section className="login-right">
          <div className="login-glass-card">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Continue your scientific research.</p>
            </div>

            <form className="premium-form" onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="email">Work Email</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="dr.smith@university.edu"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="form-options">
                <label className="remember-checkbox">
                  <input type="checkbox" />
                  Remember Me
                </label>
                <a
                  href="/forgot-password"
                  className="forgot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/forgot-password');
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              <motion.button
                type="submit"
                className="submit-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In <FaArrowRight className="btn-arrow" />
              </motion.button>
            </form>

            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <div className="social-login">
              <button type="button" className="social-btn">
                <FaMicrosoft className="social-icon ms" /> Microsoft
              </button>
              <button type="button" className="social-btn">
                <FaGoogle className="social-icon google" /> Google
              </button>
            </div>

            <div className="form-footer">
              <p>
                Don't have an account?{' '}
                <a
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/register');
                  }}
                >
                  Create Account
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default Login;
