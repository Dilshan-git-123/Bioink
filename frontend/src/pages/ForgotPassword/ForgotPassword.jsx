import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaMicroscope } from 'react-icons/fa';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const navigate = useNavigate();

    return (
        <div className="forgot-page">
            <div className="forgot-container">
                
                {/* Left Section: Branding */}
                <div className="forgot-left">
                    <div className="forgot-left-content">
                        <div className="forgot-logo">
                            <h1>🧬 BioInkAI</h1>
                        </div>
                        <div className="forgot-hero-text">
                            <h2>Secure Account Recovery</h2>
                            <p>Regain access to your laboratory workspace and continue formulating biomaterials without losing your predictive data.</p>
                        </div>
                        <div className="illustration-placeholder">
                            <FaMicroscope className="illustration-icon" />
                            <span>Scientific Platform</span>
                        </div>
                    </div>
                </div>

                {/* Right Section: Form */}
                <div className="forgot-right">
                    <div className="forgot-form-container">
                        <div className="forgot-header">
                            <h2>Reset Password</h2>
                            <p>Enter the email address associated with your account and we'll send you a link to reset your password.</p>
                        </div>

                        <form className="forgot-form" onSubmit={(e) => e.preventDefault()}>
                            <div className="input-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <FaEnvelope className="input-icon" />
                                    <input type="email" placeholder="dr.smith@university.edu" required />
                                </div>
                            </div>

                            <button type="submit" className="forgot-submit-btn">
                                Send Reset Link
                            </button>
                        </form>

                        <div className="forgot-divider">
                            <span>OR</span>
                        </div>

                        <div className="forgot-footer">
                            <p><a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>← Back to Login</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
