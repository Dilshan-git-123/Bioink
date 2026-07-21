import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaMicrosoft, FaArrowRight } from 'react-icons/fa';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        navigate('/initialize');
    };

    return (
        <div className={`login-page ${isLoaded ? 'loaded' : ''}`}>
            {/* Background Animations */}
            <div className="login-bg-mesh"></div>
            <div className="particles-container">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className={`floating-particle p-${i + 1}`}></div>
                ))}
            </div>

            <div className="login-container">
                {/* Left Section: Visual Branding */}
                <div className="login-left">
                    <div className="left-content">
                        <div className="brand-header">
                            <h1 className="brand-title">
                                <span className="dna-icon">🧬</span> BioInkAI
                            </h1>
                            <div className="brand-badge">Premium Workspace</div>
                        </div>

                        <div className="hero-text-block">
                            <h2 className="hero-title">AI-Powered Bioink Design Platform</h2>
                            <p className="hero-subtitle">Design • Predict • Optimize</p>
                        </div>

                        {/* Premium Scientific Illustration */}
                        <div className="scientific-illustration-container">
                            <img src="../../assets/images/login-illustration.png" alt="BioInkAI Platform" className="premium-illustration" />
                        </div>

                        <div className="quote-block">
                            <p className="quote-text">
                                "Advancing the Future of 3D Bioprinting through Artificial Intelligence."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Section: Glassmorphism Login Card */}
                <div className="login-right">
                    <div className="login-glass-card">
                        <div className="form-header">
                            <h2>Welcome Back</h2>
                            <p>Sign in to continue your research journey.</p>
                        </div>

                        <form className="premium-form" onSubmit={handleLogin}>
                            <div className="input-group">
                                <label>Work Email</label>
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

                            <div className="form-options">
                                <label className="remember-checkbox">
                                    <input type="checkbox" />
                                    <span className="checkmark"></span>
                                    Remember Me
                                </label>
                                <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="forgot-link">
                                    Forgot Password?
                                </a>
                            </div>

                            <button type="submit" className="submit-btn primary-glow">
                                Sign In <FaArrowRight className="btn-arrow" />
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span>or continue with</span>
                        </div>

                        <div className="social-login">
                            <button className="social-btn" type="button">
                                <FaMicrosoft className="social-icon ms" /> Microsoft
                            </button>
                            <button className="social-btn" type="button">
                                <FaGoogle className="social-icon google" /> Google
                            </button>
                        </div>

                        <div className="form-footer">
                            <p>Don't have an account? <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Create Account</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
