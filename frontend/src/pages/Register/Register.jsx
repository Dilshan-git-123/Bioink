import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaMicroscope, FaUser } from 'react-icons/fa';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();

    return (
        <div className="register-page">
            <div className="register-container">
                
                {/* Left Section: Branding */}
                <div className="register-left">
                    <div className="register-left-content">
                        <div className="register-logo">
                            <h1>🧬 BioInkAI</h1>
                        </div>
                        <div className="register-hero-text">
                            <h2>Join the Research Network</h2>
                            <p>Create an account to begin formulating, optimizing, and validating cutting-edge biomaterials for your 3D bioprinting projects.</p>
                        </div>
                        <div className="illustration-placeholder">
                            <FaMicroscope className="illustration-icon" />
                            <span>Scientific Platform</span>
                        </div>
                    </div>
                </div>

                {/* Right Section: Form */}
                <div className="register-right">
                    <div className="register-form-container">
                        <div className="register-header">
                            <h2>Create Account</h2>
                            <p>Sign up to set up your laboratory workspace</p>
                        </div>

                        <form className="register-form" onSubmit={(e) => e.preventDefault()}>
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input type="text" placeholder="Dr. Jane Smith" required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <FaEnvelope className="input-icon" />
                                    <input type="email" placeholder="dr.smith@university.edu" required />
                                </div>
                            </div>
                            
                            <div className="input-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <FaLock className="input-icon" />
                                    <input type="password" placeholder="••••••••" required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className="input-wrapper">
                                    <FaLock className="input-icon" />
                                    <input type="password" placeholder="••••••••" required />
                                </div>
                            </div>

                            <button type="submit" className="register-submit-btn">
                                Create Account
                            </button>
                        </form>

                        <div className="register-divider">
                            <span>OR</span>
                        </div>

                        <div className="register-footer">
                            <p>Already have an account? <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign In</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
