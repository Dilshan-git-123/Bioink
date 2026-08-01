import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaKey, FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');

  const [token, setToken] = useState(urlToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong. Please try again.');
      }

      setSuccess(data.message);
      setFormDisabled(true);

      // Auto-navigate to login after 2 seconds
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="reset-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="reset-container">

        {/* Left Section: Branding */}
        <div className="reset-left">
          <div className="reset-left-content">
            <div className="reset-logo">
              <h1>🧬 BioInkAI</h1>
              <span className="reset-badge">GT Enterprise</span>
            </div>

            <div className="reset-hero-text">
              <h2>Secure Password Reset</h2>
              <p>
                Use the token sent to your email to create a new secure password
                and restore access to your laboratory workspace.
              </p>
            </div>

            <div className="reset-illustration">
              <div className="reset-icon-ring">
                <FaLock className="reset-center-icon" />
              </div>
              <p className="reset-illustration-label">End-to-End Secure</p>
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="reset-right">
          <div className="reset-form-container">

            <div className="reset-header">
              <h2>Reset Password</h2>
              <p>Enter your new password to regain access to your BioInkAI account.</p>
            </div>

            {/* Error Message */}
            {(error || !urlToken) && (
              <motion.div
                className="reset-alert reset-alert-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ⚠️ {error || 'Invalid or expired password reset link.'}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                className="reset-alert reset-alert-success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✅ {success}
              </motion.div>
            )}

            <form className="reset-form" onSubmit={handleSubmit}>

              {/* New Password */}
              <div className="input-group">
                <label htmlFor="new-password">New Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading || formDisabled}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowNewPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading || formDisabled}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                className="reset-submit-btn"
                disabled={loading || formDisabled || !urlToken}
                whileHover={!loading && !formDisabled && urlToken ? { scale: 1.02 } : {}}
                whileTap={!loading && !formDisabled && urlToken ? { scale: 0.98 } : {}}
                style={{ opacity: loading || formDisabled || !urlToken ? 0.7 : 1, cursor: loading || formDisabled || !urlToken ? 'not-allowed' : 'pointer' }}
              >
                {loading ? (
                  <span className="reset-btn-content">
                    <span className="reset-spinner" /> Resetting Password...
                  </span>
                ) : (
                  <span className="reset-btn-content">
                    Reset Password <FaArrowRight />
                  </span>
                )}
              </motion.button>
            </form>

            <div className="reset-footer">
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

export default ResetPassword;
