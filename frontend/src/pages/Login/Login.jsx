import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaMicrosoft, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { loginUser, googleOAuthLogin, microsoftOAuthLogin } from '../../services/authService';
import './Login.css';

// Asset imports - using only existing assets
import loginHero from '../../assets/images/login-hero.png';

const Login = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { instance } = useMsal();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginUser(email, password);
      navigate('/initialize');
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        // Send the access token or ID token to backend
        // Since we are using useGoogleLogin, it returns an access_token if flow is implicit
        // For ID token, it's better to use flow: 'auth-code' or GoogleLogin component, but since we are using custom button we can use credential from tokenResponse if it's there
        // Actually, verify_oauth2_token expects an ID Token, but useGoogleLogin by default returns an access token.
        // Let's get the user info from google first if we only have access token, or use GoogleLogin
        // For custom button to work with verify_oauth2_token we need the id_token, so we fetch it or use the id_token from response if we set flow to implicit with id_token.
        // Wait, standard useGoogleLogin only returns access_token. Let's use it to fetch user info manually or just send access_token to our backend?
        // Let's change the backend to accept access token for Google, or change frontend to get ID token.
        // We will just send the token, and on backend we can handle access token using google API if verify_oauth2_token fails.
        // Alternatively, use id_token by adding `flow: 'implicit'` ? 
        await googleOAuthLogin(tokenResponse.access_token);
        navigate('/initialize');
      } catch (err) {
        setError(err.message || "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google Login Failed");
    }
  });

  const loginWithMicrosoft = async () => {
    setLoading(true);
    setError('');
    try {
      const loginResponse = await instance.loginPopup({
        scopes: ["user.read"]
      });
      if (loginResponse.accessToken) {
        await microsoftOAuthLogin(loginResponse.accessToken);
        navigate('/initialize');
      }
    } catch (err) {
      setError(err.message || "Microsoft login failed");
    } finally {
      setLoading(false);
    }
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
              <span className="brand-badge">GT Enterprise</span>
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

            {error && (
              <div className="auth-error-alert" style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                ⚠️ {error}
              </div>
            )}

            <form className="premium-form" onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="email">Work Email</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="mail_id@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-options">
                <label className="remember-checkbox">
                  <input type="checkbox" />
                  Remember Me
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <motion.button
                type="submit"
                className="submit-btn"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Authenticating...' : <><span style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}>Sign In <FaArrowRight className="btn-arrow" /></span></>}
              </motion.button>
            </form>

            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <div className="social-login">
              <button type="button" className="social-btn" onClick={loginWithMicrosoft} disabled={loading}>
                <FaMicrosoft className="social-icon ms" /> Microsoft
              </button>
              <button type="button" className="social-btn" onClick={() => loginWithGoogle()} disabled={loading}>
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
