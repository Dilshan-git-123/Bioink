import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setDevToken('');

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong. Please try again.');
      }

      setSuccess(data.message);

      // DEVELOPMENT ONLY — display token returned by dev backend
      if (data.reset_token) {
        setDevToken(data.reset_token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="forgot-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="forgot-container">

        {/* Left Section: Branding */}
        <div className="forgot-left">
          <div className="forgot-left-content">
            <div className="forgot-logo">
              <h1>🧬 BioInkAI</h1>
              <span className="forgot-badge">GT Enterprise</span>
            </div>

            <div className="forgot-hero-text">
              <h2>Secure Account Recovery</h2>
              <p>
                Regain access to your laboratory workspace and continue formulating
                biomaterials without losing your predictive data.
              </p>
            </div>

            <div className="forgot-illustration">
              <div className="forgot-icon-ring">
                <FaEnvelope className="forgot-center-icon" />
              </div>
              <p className="forgot-illustration-label">Secure Password Reset</p>
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="forgot-right">
          <div className="forgot-form-container">

            <div className="forgot-header">
              <h2>Forgot Password</h2>
              <p>Enter your registered email address to receive password reset instructions.</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="forgot-alert forgot-alert-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                className="forgot-alert forgot-alert-success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✅ {success}
              </motion.div>
            )}

            {/* DEVELOPMENT ONLY — Remove before production */}
            {devToken && (
              <motion.div
                className="forgot-alert forgot-dev-token"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p style={{ margin: '0 0 6px 0', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🛠 Development Reset Token
                </p>
                <code style={{ wordBreak: 'break-all', fontSize: '13px' }}>{devToken}</code>
              </motion.div>
            )}

            <form className="forgot-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="forgot-email">Email Address</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                className="forgot-submit-btn"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? (
                  <span className="forgot-btn-content">
                    <span className="forgot-spinner" /> Sending Link...
                  </span>
                ) : (
                  <span className="forgot-btn-content">
                    Send Reset Link <FaArrowRight />
                  </span>
                )}
              </motion.button>
            </form>

            <div className="forgot-footer">
              <p>
                <a
                  href="/login"
                  onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                >
                  <FaArrowLeft style={{ marginRight: '6px', fontSize: '12px' }} />
                  Back to Login
                </a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
